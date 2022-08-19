// need to load environment first
import { ExtendableContext } from "koa"
import * as env from "./environment"
import db from "./db"
db.init()
const Koa = require("koa")
const destroyable = require("server-destroy")
const koaBody = require("koa-body")
const pino = require("koa-pino-logger")
const http = require("http")
const api = require("./api")
const eventEmitter = require("./events")
const automations = require("./automations/index")
const Sentry = require("@sentry/node")
const fileSystem = require("./utilities/fileSystem")
const bullboard = require("./automations/bullboard")
const { logAlert } = require("@budibase/backend-core/logging")
const { pinoSettings } = require("@budibase/backend-core")
const { Thread } = require("./threads")
const chokidar = require("chokidar")
const fs = require("fs")
const path = require("path")
const SocketIO = require("socket.io")
import redis from "./utilities/redis"
import * as migrations from "./migrations"
import { events, installation, tenancy } from "@budibase/backend-core"
import { createAdminUser, getChecklist } from "./utilities/workerRequests"
import { processPlugin } from "./api/controllers/plugin"
import { DEFAULT_TENANT_ID } from "@budibase/backend-core/constants"

const app = new Koa()

// set up top level koa middleware
app.use(
  koaBody({
    multipart: true,
    formLimit: "10mb",
    jsonLimit: "10mb",
    textLimit: "10mb",
    enableTypes: ["json", "form", "text"],
    parsedMethods: ["POST", "PUT", "PATCH", "DELETE"],
  })
)

app.use(pino(pinoSettings()))

if (!env.isTest()) {
  const plugin = bullboard.init()
  app.use(plugin)
}

app.context.eventEmitter = eventEmitter
app.context.auth = {}

// api routes
app.use(api.router.routes())

if (env.isProd()) {
  env._set("NODE_ENV", "production")
  Sentry.init()

  app.on("error", (err: any, ctx: ExtendableContext) => {
    Sentry.withScope(function (scope: any) {
      scope.addEventProcessor(function (event: any) {
        return Sentry.Handlers.parseRequest(event, ctx.request)
      })
      Sentry.captureException(err)
    })
  })
}

const server = http.createServer(app.callback())
destroyable(server)

// Websocket
export const io = SocketIO(server, {
  path: "/socket/",
  cors: {
    origin: ["https://hmr.lan.kingston.dev"],
    methods: ["GET", "POST"],
  },
})

let shuttingDown = false,
  errCode = 0
server.on("close", async () => {
  // already in process
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  if (!env.isTest()) {
    console.log("Server Closed")
  }
  await automations.shutdown()
  await redis.shutdown()
  await events.shutdown()
  await Thread.shutdown()
  api.shutdown()
  if (!env.isTest()) {
    process.exit(errCode)
  }
})

module.exports = server.listen(env.PORT || 0, async () => {
  console.log(`Budibase running on ${JSON.stringify(server.address())}`)
  env._set("PORT", server.address().port)
  eventEmitter.emitPort(env.PORT)
  fileSystem.init()
  await redis.init()

  // run migrations on startup if not done via http
  // not recommended in a clustered environment
  if (!env.HTTP_MIGRATIONS && !env.isTest()) {
    try {
      await migrations.migrate()
    } catch (e) {
      logAlert("Error performing migrations. Exiting.", e)
      shutdown()
    }
  }

  // check and create admin user if required
  if (
    env.SELF_HOSTED &&
    !env.MULTI_TENANCY &&
    env.BB_ADMIN_USER_EMAIL &&
    env.BB_ADMIN_USER_PASSWORD
  ) {
    const checklist = await getChecklist()
    if (!checklist?.adminUser?.checked) {
      try {
        const tenantId = tenancy.getTenantId()
        await createAdminUser(
          env.BB_ADMIN_USER_EMAIL,
          env.BB_ADMIN_USER_PASSWORD,
          tenantId
        )
        console.log(
          "Admin account automatically created for",
          env.BB_ADMIN_USER_EMAIL
        )
      } catch (e) {
        logAlert("Error creating initial admin user. Exiting.", e)
        shutdown()
      }
    }
  }

  // monitor plugin directory if required
  if (
    env.SELF_HOSTED &&
    !env.MULTI_TENANCY &&
    env.PLUGINS_DIR &&
    fs.existsSync(env.PLUGINS_DIR)
  ) {
    const watchPath = path.join(env.PLUGINS_DIR, "./**/*.tar.gz")
    chokidar
      .watch(watchPath, {
        ignored: "**/node_modules",
        awaitWriteFinish: true,
      })
      .on("all", async (event: string, path: string) => {
        // Sanity checks
        if (!path?.endsWith(".tar.gz") || !fs.existsSync(path)) {
          return
        }
        await tenancy.doInTenant(DEFAULT_TENANT_ID, async () => {
          try {
            const split = path.split("/")
            const name = split[split.length - 1]
            console.log("Importing plugin:", path)
            await processPlugin({ name, path })
          } catch (err) {
            console.log("Failed to import plugin:", err)
          }
        })
      })
  }

  // check for version updates
  await installation.checkInstallVersion()

  // done last - this will never complete
  await automations.init()
})

const shutdown = () => {
  server.close()
  server.destroy()
}

process.on("uncaughtException", err => {
  // @ts-ignore
  // don't worry about this error, comes from zlib isn't important
  if (err && err["code"] === "ERR_INVALID_CHAR") {
    return
  }
  errCode = -1
  logAlert("Uncaught exception.", err)
  shutdown()
})

process.on("SIGTERM", () => {
  shutdown()
})
