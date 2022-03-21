import env from "../../environment"
import packageJson from "../../../package.json"
import {
  createLinkView,
  createRoutingView,
  createAllSearchIndex,
} from "../../db/views/staticViews"
import {
  getTemplateStream,
  createApp,
  deleteApp,
} from "../../utilities/fileSystem"
import {
  generateAppID,
  getLayoutParams,
  getScreenParams,
  generateDevAppID,
  DocumentTypes,
  AppStatus,
} from "../../db/utils"
const {
  BUILTIN_ROLE_IDS,
  AccessController,
} = require("@budibase/backend-core/roles")
import { BASE_LAYOUTS } from "../../constants/layouts"
import { cloneDeep } from "lodash/fp"
const { processObject } = require("@budibase/string-templates")
const {
  getAllApps,
  isDevAppID,
  getProdAppID,
  Replication,
} = require("@budibase/backend-core/db")
import { USERS_TABLE_SCHEMA } from "../../constants"
import { removeAppFromUserRoles } from "../../utilities/workerRequests"
import { clientLibraryPath, stringToReadStream } from "../../utilities"
import { getAllLocks } from "../../utilities/redis"
import {
  updateClientLibrary,
  backupClientLibrary,
  revertClientLibrary,
} from "../../utilities/fileSystem/clientLibrary"
const { getTenantId, isMultiTenant } = require("@budibase/backend-core/tenancy")
import { syncGlobalUsers } from "./user"
const { app: appCache } = require("@budibase/backend-core/cache")
import { cleanupAutomations } from "../../automations/utils"
const {
  getAppDB,
  getProdAppDB,
  updateAppId,
} = require("@budibase/backend-core/context")
import { getUniqueRows } from "../../utilities/usageQuota/rows"
import { quotas } from "@budibase/pro"
import { errors } from "@budibase/backend-core"

const URL_REGEX_SLASH = /\/|\\/g

// utility function, need to do away with this
async function getLayouts() {
  const db = getAppDB()
  return (
    await db.allDocs(
      getLayoutParams(null, {
        include_docs: true,
      })
    )
  ).rows.map((row: any) => row.doc)
}

async function getScreens() {
  const db = getAppDB()
  return (
    await db.allDocs(
      getScreenParams(null, {
        include_docs: true,
      })
    )
  ).rows.map((row: any) => row.doc)
}

function getUserRoleId(ctx: any) {
  return !ctx.user.role || !ctx.user.role._id
    ? BUILTIN_ROLE_IDS.PUBLIC
    : ctx.user.role._id
}

export const getAppUrl = (ctx: any) => {
  // construct the url
  let url
  if (ctx.request.body.url) {
    // if the url is provided, use that
    url = encodeURI(ctx.request.body.url)
  } else if (ctx.request.body.name) {
    // otherwise use the name
    url = encodeURI(`${ctx.request.body.name}`)
  }
  if (url) {
    url = `/${url.replace(URL_REGEX_SLASH, "")}`.toLowerCase()
  }
  return url
}

const checkAppUrl = (ctx: any, apps: any, url: any, currentAppId?: string) => {
  if (currentAppId) {
    apps = apps.filter((app: any) => app.appId !== currentAppId)
  }
  if (apps.some((app: any) => app.url === url)) {
    ctx.throw(400, "App URL is already in use.")
  }
}

const checkAppName = (
  ctx: any,
  apps: any,
  name: any,
  currentAppId?: string
) => {
  // TODO: Replace with Joi
  if (!name) {
    ctx.throw(400, "Name is required")
  }
  if (currentAppId) {
    apps = apps.filter((app: any) => app.appId !== currentAppId)
  }
  if (apps.some((app: any) => app.name === name)) {
    ctx.throw(400, "App name is already in use.")
  }
}

async function createInstance(template: any) {
  const tenantId = isMultiTenant() ? getTenantId() : null
  const baseAppId = generateAppID(tenantId)
  const appId = generateDevAppID(baseAppId)
  updateAppId(appId)

  const db = getAppDB()
  await db.put({
    _id: "_design/database",
    // view collation information, read before writing any complex views:
    // https://docs.couchdb.org/en/master/ddocs/views/collation.html#collation-specification
    views: {},
  })

  // NOTE: indexes need to be created before any tables/templates
  // add view for linked rows
  await createLinkView()
  await createRoutingView()
  await createAllSearchIndex()

  // replicate the template data to the instance DB
  // this is currently very hard to test, downloading and importing template files
  if (template && template.templateString) {
    const { ok } = await db.load(stringToReadStream(template.templateString))
    if (!ok) {
      throw "Error loading database dump from memory."
    }
  } else if (template && template.useTemplate === "true") {
    /* istanbul ignore next */
    const { ok } = await db.load(await getTemplateStream(template))
    if (!ok) {
      throw "Error loading database dump from template."
    }
  } else {
    // create the users table
    await db.put(USERS_TABLE_SCHEMA)
  }

  return { _id: appId }
}

export const fetch = async (ctx: any) => {
  const dev = ctx.query && ctx.query.status === AppStatus.DEV
  const all = ctx.query && ctx.query.status === AppStatus.ALL
  const apps = await getAllApps({ dev, all })

  // get the locks for all the dev apps
  if (dev || all) {
    const locks = await getAllLocks()
    for (let app of apps) {
      if (app.status !== "development") {
        continue
      }
      const lock = locks.find((lock: any) => lock.appId === app.appId)
      if (lock) {
        app.lockedBy = lock.user
      } else {
        // make sure its definitely not present
        delete app.lockedBy
      }
    }
  }

  ctx.body = apps
}

export const fetchAppDefinition = async (ctx: any) => {
  const layouts = await getLayouts()
  const userRoleId = getUserRoleId(ctx)
  const accessController = new AccessController()
  const screens = await accessController.checkScreensAccess(
    await getScreens(),
    userRoleId
  )
  ctx.body = {
    layouts,
    screens,
    libraries: ["@budibase/standard-components"],
  }
}

export const fetchAppPackage = async (ctx: any) => {
  const db = getAppDB()
  const application = await db.get(DocumentTypes.APP_METADATA)
  const layouts = await getLayouts()
  let screens = await getScreens()

  // Only filter screens if the user is not a builder
  if (!(ctx.user.builder && ctx.user.builder.global)) {
    const userRoleId = getUserRoleId(ctx)
    const accessController = new AccessController()
    screens = await accessController.checkScreensAccess(screens, userRoleId)
  }

  ctx.body = {
    application,
    screens,
    layouts,
    clientLibPath: clientLibraryPath(ctx.params.appId, application.version),
  }
}

const performAppCreate = async (ctx: any) => {
  const apps = await getAllApps({ dev: true })
  const name = ctx.request.body.name
  checkAppName(ctx, apps, name)
  const url = exports.getAppUrl(ctx)
  checkAppUrl(ctx, apps, url)

  const { useTemplate, templateKey, templateString } = ctx.request.body
  const instanceConfig: any = {
    useTemplate,
    key: templateKey,
    templateString,
  }
  if (ctx.request.files && ctx.request.files.templateFile) {
    instanceConfig.file = ctx.request.files.templateFile
  }
  const instance = await createInstance(instanceConfig)
  const appId = instance._id

  const db = getAppDB()
  let _rev
  try {
    // if template there will be an existing doc
    const existing = await db.get(DocumentTypes.APP_METADATA)
    _rev = existing._rev
  } catch (err) {
    // nothing to do
  }
  const newApplication = {
    _id: DocumentTypes.APP_METADATA,
    _rev,
    appId: instance._id,
    type: "app",
    version: packageJson.version,
    componentLibraries: ["@budibase/standard-components"],
    name: name,
    url: url,
    template: ctx.request.body.template,
    instance: instance,
    tenantId: getTenantId(),
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: AppStatus.DEV,
  }
  const response = await db.put(newApplication, { force: true })
  newApplication._rev = response.rev

  // Only create the default home screens and layout if we aren't importing
  // an app
  if (useTemplate !== "true") {
    await createEmptyAppPackage(ctx, newApplication)
  }

  /* istanbul ignore next */
  if (!env.isTest()) {
    await createApp(appId)
  }

  await appCache.invalidateAppMetadata(appId, newApplication)
  return newApplication
}

const appPostCreate = async (ctx: any, appId: string) => {
  // app import & template creation
  if (ctx.request.body.useTemplate === "true") {
    const rows = await getUniqueRows([appId])
    const rowCount = rows ? rows.length : 0
    if (rowCount) {
      try {
        await quotas.addRows(rowCount)
      } catch (err: any) {
        if (err.code && err.code === errors.codes.USAGE_LIMIT_EXCEEDED) {
          // this import resulted in row usage exceeding the quota
          // delete the app
          // skip pre and post steps as no rows have been added to quotas yet
          ctx.params.appId = appId
          await destroyApp(ctx)
        }
        throw err
      }
    }
  }
}

export const create = async (ctx: any) => {
  const newApplication = await quotas.addApp(() => performAppCreate(ctx))
  await appPostCreate(ctx, newApplication.appId)
  ctx.body = newApplication
  ctx.status = 200
}

// This endpoint currently operates as a PATCH rather than a PUT
// Thus name and url fields are handled only if present
export const update = async (ctx: any) => {
  const apps = await getAllApps({ dev: true })
  // validation
  const name = ctx.request.body.name
  if (name) {
    checkAppName(ctx, apps, name, ctx.params.appId)
  }
  const url = await exports.getAppUrl(ctx)
  if (url) {
    checkAppUrl(ctx, apps, url, ctx.params.appId)
    ctx.request.body.url = url
  }

  const data = await updateAppPackage(ctx.request.body, ctx.params.appId)
  ctx.status = 200
  ctx.body = data
}

export const updateClient = async (ctx: any) => {
  // Get current app version
  const db = getAppDB()
  const application = await db.get(DocumentTypes.APP_METADATA)
  const currentVersion = application.version

  // Update client library and manifest
  if (!env.isTest()) {
    await backupClientLibrary(ctx.params.appId)
    await updateClientLibrary(ctx.params.appId)
  }

  // Update versions in app package
  const appPackageUpdates = {
    version: packageJson.version,
    revertableVersion: currentVersion,
  }
  const data = await updateAppPackage(appPackageUpdates, ctx.params.appId)
  ctx.status = 200
  ctx.body = data
}

export const revertClient = async (ctx: any) => {
  // Check app can be reverted
  const db = getAppDB()
  const application = await db.get(DocumentTypes.APP_METADATA)
  if (!application.revertableVersion) {
    ctx.throw(400, "There is no version to revert to")
  }

  // Update client library and manifest
  if (!env.isTest()) {
    await revertClientLibrary(ctx.params.appId)
  }

  // Update versions in app package
  const appPackageUpdates = {
    version: application.revertableVersion,
    revertableVersion: null,
  }
  const data = await updateAppPackage(appPackageUpdates, ctx.params.appId)
  ctx.status = 200
  ctx.body = data
}

const destroyApp = async (ctx: any) => {
  const db = getAppDB()

  const result = await db.destroy()
  if (ctx.query.unpublish) {
    await quotas.removePublishedApp()
  } else {
    await quotas.removeApp()
  }
  /* istanbul ignore next */
  if (!env.isTest() && !ctx.query.unpublish) {
    await deleteApp(ctx.params.appId)
  }
  if (ctx.query && ctx.query.unpublish) {
    await cleanupAutomations(ctx.params.appId)
  }
  // make sure the app/role doesn't stick around after the app has been deleted
  await removeAppFromUserRoles(ctx, ctx.params.appId)
  await appCache.invalidateAppMetadata(ctx.params.appId)
  return result
}

const preDestroyApp = async (ctx: any) => {
  const rows = await getUniqueRows([ctx.appId])
  ctx.rowCount = rows.length
}

const postDestroyApp = async (ctx: any) => {
  const rowCount = ctx.rowCount
  if (rowCount) {
    await quotas.removeRows(rowCount)
  }
}

export const destroy = async (ctx: any) => {
  await preDestroyApp(ctx)
  const result = await destroyApp(ctx)
  await postDestroyApp(ctx)
  ctx.status = 200
  ctx.body = result
}

export const sync = async (ctx: any, next: any) => {
  const appId = ctx.params.appId
  if (!isDevAppID(appId)) {
    ctx.throw(400, "This action cannot be performed for production apps")
  }

  // replicate prod to dev
  const prodAppId = getProdAppID(appId)

  try {
    // specific case, want to make sure setup is skipped
    const prodDb = getProdAppDB({ skip_setup: true })
    const info = await prodDb.info()
    if (info.error) throw info.error
  } catch (err) {
    // the database doesn't exist. Don't replicate
    ctx.status = 200
    ctx.body = {
      message: "App sync not required, app not deployed.",
    }
    return next()
  }

  const replication = new Replication({
    source: prodAppId,
    target: appId,
  })
  let error
  try {
    await replication.replicate({
      filter: function (doc: any) {
        return doc._id !== DocumentTypes.APP_METADATA
      },
    })
  } catch (err) {
    error = err
  }

  // sync the users
  await syncGlobalUsers()

  if (error) {
    ctx.throw(400, error)
  } else {
    ctx.body = {
      message: "App sync completed successfully.",
    }
  }
}

const updateAppPackage = async (appPackage: any, appId: any) => {
  const db = getAppDB()
  const application = await db.get(DocumentTypes.APP_METADATA)

  const newAppPackage = { ...application, ...appPackage }
  if (appPackage._rev !== application._rev) {
    newAppPackage._rev = application._rev
  }

  // the locked by property is attached by server but generated from
  // Redis, shouldn't ever store it
  delete newAppPackage.lockedBy

  const response = await db.put(newAppPackage)
  // remove any cached metadata, so that it will be updated
  await appCache.invalidateAppMetadata(appId)
  return response
}

const createEmptyAppPackage = async (ctx: any, app: any) => {
  const db = getAppDB()

  let screensAndLayouts = []
  for (let layout of BASE_LAYOUTS) {
    const cloned = cloneDeep(layout)
    screensAndLayouts.push(await processObject(cloned, app))
  }

  await db.bulkDocs(screensAndLayouts)
}
