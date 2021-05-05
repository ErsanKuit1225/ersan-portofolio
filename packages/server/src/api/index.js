const Router = require("@koa/router")
const { buildAuthMiddleware } = require("@budibase/auth").auth
const currentApp = require("../middleware/currentapp")
const compress = require("koa-compress")
const zlib = require("zlib")
const { mainRoutes, staticRoutes } = require("./routes")
const pkg = require("../../package.json")
const env = require("../environment")

if (!env.isTest()) {
  const bullboard = require("bull-board")
  const expressApp = require("express")()

  expressApp.use("/bulladmin", bullboard.router)
}

const router = new Router()

router
  .use(
    compress({
      threshold: 2048,
      gzip: {
        flush: zlib.constants.Z_SYNC_FLUSH,
      },
      deflate: {
        flush: zlib.constants.Z_SYNC_FLUSH,
      },
      br: false,
    })
  )
  .use(async (ctx, next) => {
    ctx.config = {
      jwtSecret: env.JWT_SECRET,
      useAppRootPath: true,
    }
    await next()
  })
  .use("/health", ctx => (ctx.status = 200))
  .use("/version", ctx => (ctx.body = pkg.version))
  .use(
    buildAuthMiddleware(null, {
      publicAllowed: true,
    })
  )
  .use(currentApp)

// error handling middleware
router.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || err.statusCode || 500
    ctx.body = {
      message: err.message,
      status: ctx.status,
    }
    if (env.NODE_ENV !== "jest") {
      ctx.log.error(err)
      console.trace(err)
    }
  }
})

router.get("/health", ctx => (ctx.status = 200))

// authenticated routes
for (let route of mainRoutes) {
  router.use(route.routes())
  router.use(route.allowedMethods())
}

// WARNING - static routes will catch everything else after them this must be last
router.use(staticRoutes.routes())
router.use(staticRoutes.allowedMethods())

router.redirect("/", "/builder")

module.exports = router
