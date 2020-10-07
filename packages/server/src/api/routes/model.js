const Router = require("@koa/router")
const modelController = require("../controllers/model")
const authorized = require("../../middleware/authorized")
const usage = require("../../middleware/usageQuota")
const { BUILDER, READ_MODEL } = require("../../utilities/accessLevels")

const router = Router()

router
  .get("/api/models", authorized(BUILDER), modelController.fetch)
  .get(
    "/api/models/:id",
    authorized(READ_MODEL, ctx => ctx.params.id),
    modelController.find
  )
  .post("/api/models", authorized(BUILDER), usage, modelController.save)
  .post(
    "/api/models/csv/validate",
    authorized(BUILDER),
    modelController.validateCSVSchema
  )
  .delete(
    "/api/models/:modelId/:revId",
    authorized(BUILDER),
    usage,
    modelController.destroy
  )

module.exports = router
