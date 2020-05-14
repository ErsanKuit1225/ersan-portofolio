const CouchDB = require("../../db")
const uuid = require("uuid")
const env = require("../../environment")

const clientDatabaseId = clientId => `client-${clientId}`

exports.create = async function(ctx) {
  const instanceName = ctx.request.body.name
  const uid = uuid.v4().replace(/-/g, "")
  const instanceId = `${ctx.params.applicationId.substring(0,7)}_${uid}`
  const { applicationId } = ctx.params
  const clientId = env.CLIENT_ID
  const db = new CouchDB(instanceId)
  await db.put({
    _id: "_design/database",
    metadata: {
      clientId,
      applicationId,
    },
    views: {
      by_username: {
        map: function(doc) {
          if (doc.type === "user") {
            emit([doc.username], doc._id)
          }
        }.toString(),
      },
      by_type: {
        map: function(doc) {
          emit([doc.type], doc._id)
        }.toString(),
      },
    },
  })

  // Add the new instance under the app clientDB
  const clientDb = new CouchDB(clientDatabaseId(clientId))
  const budibaseApp = await clientDb.get(applicationId)
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
  const clientDb = new CouchDB(clientDatabaseId(metadata.clientId))
  const budibaseApp = await clientDb.get(metadata.applicationId)
  budibaseApp.instances = budibaseApp.instances.filter(
    instance => instance !== ctx.params.instanceId
  )
  await clientDb.put(budibaseApp)

  ctx.status = 200
  ctx.message = `Instance Database ${ctx.params.instanceId} successfully destroyed.`
}
