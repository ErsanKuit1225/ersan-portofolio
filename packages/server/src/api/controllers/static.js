const send = require("koa-send")
const { resolve, join } = require("path")
const {
  budibaseAppsDir,
  budibaseTempDir,
} = require("../../utilities/budibaseDir")
const setBuilderToken = require("../../utilities/builder/setBuilderToken")
const { ANON_LEVEL_ID } = require("../../utilities/accessLevels")

exports.serveBuilder = async function(ctx) {
  let builderPath = resolve(__dirname, "../../../builder")
  setBuilderToken(ctx)
  await send(ctx, ctx.file, { root: ctx.devPath || builderPath })
}

exports.serveApp = async function(ctx) {
  // default to homedir
  const appPath = resolve(
    budibaseAppsDir(),
    ctx.params.appId,
    "public",
    ctx.isAuthenticated ? "main" : "unauthenticated"
  )
  // only set the appId cookie for /appId .. we COULD check for valid appIds
  // but would like to avoid that DB hit
  if (looksLikeAppId(ctx.params.appId) && !ctx.isAuthenticated) {
    const anonToken = {
      userId: "ANON",
      accessLevelId: ANON_LEVEL_ID,
      appId: ctx.params.appId,
    }
    ctx.cookies.set("budibase:token", anonToken, {
      path: "/",
      httpOnly: false,
    })
  }

  await send(ctx, ctx.file || "index.html", { root: ctx.devPath || appPath })
}

exports.serveAppAsset = async function(ctx) {
  // default to homedir
  const appPath = resolve(
    budibaseAppsDir(),
    ctx.user.appId,
    "public",
    ctx.isAuthenticated ? "main" : "unauthenticated"
  )

  await send(ctx, ctx.file, { root: ctx.devPath || appPath })
}

exports.serveComponentLibrary = async function(ctx) {
  // default to homedir
  let componentLibraryPath = resolve(
    budibaseAppsDir(),
    ctx.user.appId,
    "node_modules",
    decodeURI(ctx.query.library),
    "dist"
  )

  if (ctx.isDev) {
    componentLibraryPath = join(
      budibaseTempDir(),
      decodeURI(ctx.query.library),
      "dist"
    )
  }

  await send(ctx, "/index.js", { root: componentLibraryPath })
}

const looksLikeAppId = appId => /^[0-9a-f]{32}$/.test(appId)
