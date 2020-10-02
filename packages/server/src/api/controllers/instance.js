const CouchDB = require("../../db")
const client = require("../../db/clientDb")
const newid = require("../../db/newid")

exports.create = async function(ctx) {
  const instanceName = ctx.request.body.name
  const { appId } = ctx.user
  const appShortId = appId.substring(0, 7)
  const instanceId = `inst_${appShortId}_${newid()}`

  const masterDb = new CouchDB("client_app_lookup")
  const { clientId } = await masterDb.get(appId)

  const db = new CouchDB(instanceId)
  await db.put({
    _id: "_design/database",
    metadata: {
      clientId,
      applicationId: appId,
    },
    views: {},
  })

  // Add the new instance under the app clientDB
  const clientDb = new CouchDB(client.name(clientId))
  const budibaseApp = await clientDb.get(appId)
  const instance = { _id: instanceId, name: instanceName }
  budibaseApp.instances.push(instance)
  await clientDb.put(budibaseApp)

  ctx.status = 200
  ctx.message = `Instance Database ${instanceName} successfully provisioned.`
  ctx.body = instance
}

exports.destroy = async function(ctx) {
  const db = new CouchDB(ctx.params.instanceId)
  const designDoc = await db.get("_design/database")
  await db.destroy()

  // remove instance from client application document
  const { metadata } = designDoc
  const clientDb = new CouchDB(client.name(metadata.clientId))
  const budibaseApp = await clientDb.get(metadata.applicationId)
  budibaseApp.instances = budibaseApp.instances.filter(
    instance => instance !== ctx.params.instanceId
  )
  await clientDb.put(budibaseApp)

  ctx.status = 200
  ctx.message = `Instance Database ${ctx.params.instanceId} successfully destroyed.`
}
