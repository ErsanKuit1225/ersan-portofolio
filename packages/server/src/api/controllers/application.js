const CouchDB = require("../../db")
const compileStaticAssets = require("../../utilities/builder/compileStaticAssets")
const env = require("../../environment")
const { existsSync } = require("fs-extra")
const { budibaseAppsDir } = require("../../utilities/budibaseDir")
const setBuilderToken = require("../../utilities/builder/setBuilderToken")
const fs = require("fs-extra")
const { join, resolve } = require("../../utilities/centralPath")
const packageJson = require("../../../package.json")
const { createLinkView } = require("../../db/linkedRows")
const { createRoutingView } = require("../../utilities/routing")
const { downloadTemplate } = require("../../utilities/templates")
const {
  generateAppID,
  DocumentTypes,
  SEPARATOR,
  getLayoutParams,
  getScreenParams,
  generateScreenID,
} = require("../../db/utils")
const {
  BUILTIN_ROLE_IDS,
  AccessController,
} = require("../../utilities/security/roles")
const {
  downloadExtractComponentLibraries,
} = require("../../utilities/createAppPackage")
const { BASE_LAYOUTS } = require("../../constants/layouts")
const {
  createHomeScreen,
  createLoginScreen,
} = require("../../constants/screens")
const { cloneDeep } = require("lodash/fp")
const { objectHandlebars } = require("../../utilities/handlebars")
const { USERS_TABLE_SCHEMA } = require("../../constants")

const APP_PREFIX = DocumentTypes.APP + SEPARATOR

// utility function, need to do away with this
async function getLayouts(db) {
  return (
    await db.allDocs(
      getLayoutParams(null, {
        include_docs: true,
      })
    )
  ).rows.map(row => row.doc)
}

async function getScreens(db) {
  return (
    await db.allDocs(
      getScreenParams(null, {
        include_docs: true,
      })
    )
  ).rows.map(row => row.doc)
}

function getUserRoleId(ctx) {
  return !ctx.user.role || !ctx.user.role._id
    ? BUILTIN_ROLE_IDS.PUBLIC
    : ctx.user.role._id
}

async function createInstance(template) {
  const appId = generateAppID()

  const db = new CouchDB(appId)
  await db.put({
    _id: "_design/database",
    // view collation information, read before writing any complex views:
    // https://docs.couchdb.org/en/master/ddocs/views/collation.html#collation-specification
    views: {},
  })
  // add view for linked rows
  await createLinkView(appId)
  await createRoutingView(appId)

  // replicate the template data to the instance DB
  if (template) {
    const templatePath = await downloadTemplate(...template.key.split("/"))
    const dbDumpReadStream = fs.createReadStream(
      join(templatePath, "db", "dump.txt")
    )
    const { ok } = await db.load(dbDumpReadStream)
    if (!ok) {
      throw "Error loading database dump from template."
    }
  } else {
    // create the users table
    await db.put(USERS_TABLE_SCHEMA)
  }

  return { _id: appId }
}

exports.fetch = async function(ctx) {
  let allDbs = await CouchDB.allDbs()
  const appDbNames = allDbs.filter(dbName => dbName.startsWith(APP_PREFIX))
  const apps = appDbNames.map(db => new CouchDB(db).get(db))
  if (apps.length === 0) {
    ctx.body = []
  } else {
    const response = await Promise.allSettled(apps)
    ctx.body = response
      .filter(result => result.status === "fulfilled")
      .map(({ value }) => value)
  }
}

exports.fetchAppDefinition = async function(ctx) {
  const db = new CouchDB(ctx.params.appId)
  const layouts = await getLayouts(db)
  const userRoleId = getUserRoleId(ctx)
  const accessController = new AccessController(ctx.params.appId)
  const screens = await accessController.checkScreensAccess(
    await getScreens(db),
    userRoleId
  )
  ctx.body = {
    layouts,
    screens,
    libraries: ["@budibase/standard-components"],
  }
}

exports.fetchAppPackage = async function(ctx) {
  const db = new CouchDB(ctx.params.appId)
  const application = await db.get(ctx.params.appId)
  const [layouts, screens] = await Promise.all([getLayouts(db), getScreens(db)])

  ctx.body = {
    application,
    screens,
    layouts,
  }
  await setBuilderToken(ctx, ctx.params.appId, application.version)
}

exports.create = async function(ctx) {
  const instance = await createInstance(ctx.request.body.template)
  const appId = instance._id
  const version = packageJson.version
  const newApplication = {
    _id: appId,
    type: "app",
    version: packageJson.version,
    componentLibraries: ["@budibase/standard-components"],
    name: ctx.request.body.name,
    template: ctx.request.body.template,
    instance: instance,
    deployment: {
      type: "cloud",
    },
  }
  const instanceDb = new CouchDB(appId)
  await instanceDb.put(newApplication)

  if (env.NODE_ENV !== "jest") {
    const newAppFolder = await createEmptyAppPackage(ctx, newApplication)
    await downloadExtractComponentLibraries(newAppFolder)
  }

  await setBuilderToken(ctx, appId, version)
  ctx.status = 200
  ctx.body = newApplication
  ctx.message = `Application ${ctx.request.body.name} created successfully`
}

exports.update = async function(ctx) {
  const db = new CouchDB(ctx.params.appId)
  const application = await db.get(ctx.params.appId)

  const data = ctx.request.body
  const newData = { ...application, ...data }

  const response = await db.put(newData)
  data._rev = response.rev

  ctx.status = 200
  ctx.message = `Application ${application.name} updated successfully.`
  ctx.body = response
}

exports.delete = async function(ctx) {
  const db = new CouchDB(ctx.params.appId)
  const app = await db.get(ctx.params.appId)
  const result = await db.destroy()

  // remove top level directory
  await fs.rmdir(join(budibaseAppsDir(), ctx.params.appId), {
    recursive: true,
  })

  ctx.status = 200
  ctx.message = `Application ${app.name} deleted successfully.`
  ctx.body = result
}

const createEmptyAppPackage = async (ctx, app) => {
  const appsFolder = budibaseAppsDir()
  const newAppFolder = resolve(appsFolder, app._id)

  const db = new CouchDB(app._id)

  if (existsSync(newAppFolder)) {
    ctx.throw(400, "App folder already exists for this application")
  }

  fs.mkdirpSync(newAppFolder)

  let screensAndLayouts = []
  for (let layout of BASE_LAYOUTS) {
    const cloned = cloneDeep(layout)
    screensAndLayouts.push(objectHandlebars(cloned, app))
  }

  const homeScreen = createHomeScreen(app)
  homeScreen._id = generateScreenID()
  screensAndLayouts.push(homeScreen)

  const loginScreen = createLoginScreen(app)
  loginScreen._id = generateScreenID()
  screensAndLayouts.push(loginScreen)

  await db.bulkDocs(screensAndLayouts)
  await compileStaticAssets(app._id)
  return newAppFolder
}
