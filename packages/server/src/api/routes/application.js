const Router = require("@koa/router")
const controller = require("../controllers/application")
const authorized = require("../../middleware/authorized")
const { BUILDER } = require("@budibase/auth/permissions")
const usage = require("../../middleware/usageQuota")

const router = Router()

router
  .post("/api/applications", authorized(BUILDER), usage, controller.create)
  .get("/api/applications/:appId/definition", controller.fetchAppDefinition)
  .get("/api/applications", controller.fetch)
  .get("/api/applications/:appId/appPackage", controller.fetchAppPackage)
  .put("/api/applications/:appId", authorized(BUILDER), controller.update)
  .post(
    "/api/applications/:appId/client/update",
    authorized(BUILDER),
    controller.updateClient
  )
  .post(
    "/api/applications/:appId/client/revert",
    authorized(BUILDER),
    controller.revertClient
  )
  .delete("/api/applications/:appId", authorized(BUILDER), usage, controller.delete)

module.exports = router
