const Koa = require("koa")
const electron = require("electron")
const koaBody = require("koa-body")
const logger = require("koa-pino-logger")
const http = require("http")
const api = require("./api")
const env = require("./environment")
const eventEmitter = require("./events")
const Sentry = require("@sentry/node")

const app = new Koa()

// set up top level koa middleware
app.use(koaBody({ multipart: true }))

app.use(
  logger({
    prettyPrint: {
      levelFirst: true,
    },
    level: env.LOG_LEVEL || "error",
  })
)

app.context.eventEmitter = eventEmitter

// api routes
app.use(api.routes())

if (electron.app && electron.app.isPackaged) {
  process.env.NODE_ENV = "production"
  Sentry.init()

  app.on("error", (err, ctx) => {
    Sentry.withScope(function(scope) {
      scope.addEventProcessor(function(event) {
        return Sentry.Handlers.parseRequest(event, ctx.request)
      })
      Sentry.captureException(err)
    })
  })
}

module.exports = async port => {
  const serverPort = port || env.PORT
  const server = http.createServer(app.callback())
  return server.listen(serverPort || 4001)
}
