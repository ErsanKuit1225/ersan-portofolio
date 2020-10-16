const CouchDB = require("pouchdb")
const PouchDB = require("../../../db")
const {
  uploadAppAssets,
  verifyDeployment,
  updateDeploymentQuota,
} = require("./aws")
const { DocumentTypes, SEPARATOR, UNICODE_MAX } = require("../../../db/utils")
const newid = require("../../../db/newid")

function replicate(local, remote) {
  return new Promise((resolve, reject) => {
    const replication = local.sync(remote)

    replication.on("complete", () => resolve())
    replication.on("error", err => reject(err))
  })
}

async function replicateCouch({ instanceId, clientId, credentials }) {
  const databases = [`client_${clientId}`, "client_app_lookup", instanceId]

  const replications = databases.map(localDbName => {
    const localDb = new PouchDB(localDbName)
    const remoteDb = new CouchDB(
      `${process.env.DEPLOYMENT_DB_URL}/${localDbName}`,
      {
        auth: {
          ...credentials,
        },
      }
    )

    return replicate(localDb, remoteDb)
  })

  await Promise.all(replications)
}

async function getCurrentInstanceQuota(instanceId) {
  const db = new PouchDB(instanceId)

  const rows = await db.allDocs({
    startkey: DocumentTypes.ROW + SEPARATOR,
    endkey: DocumentTypes.ROW + SEPARATOR + UNICODE_MAX,
  })

  const users = await db.allDocs({
    startkey: DocumentTypes.USER + SEPARATOR,
    endkey: DocumentTypes.USER + SEPARATOR + UNICODE_MAX,
  })

  const existingRows = rows.rows.length
  const existingUsers = users.rows.length

  const designDoc = await db.get("_design/database")

  return {
    rows: existingRows,
    users: existingUsers,
    views: Object.keys(designDoc.views).length,
  }
}

async function storeLocalDeploymentHistory(deployment) {
  const db = new PouchDB(deployment.instanceId)

  let deploymentDoc
  try {
    deploymentDoc = await db.get("_local/deployments")
  } catch (err) {
    deploymentDoc = { _id: "_local/deployments", history: {} }
  }

  const deploymentId = deployment._id || newid()

  // first time deployment
  if (!deploymentDoc.history[deploymentId])
    deploymentDoc.history[deploymentId] = {}

  deploymentDoc.history[deploymentId] = {
    ...deploymentDoc.history[deploymentId],
    ...deployment,
    updatedAt: Date.now(),
  }

  await db.put(deploymentDoc)
  return {
    _id: deploymentId,
    ...deploymentDoc.history[deploymentId],
  }
}

async function deployApp({ instanceId, appId, clientId, deploymentId }) {
  try {
    const instanceQuota = await getCurrentInstanceQuota(instanceId)
    const credentials = await verifyDeployment({
      instanceId,
      appId,
      quota: instanceQuota,
    })

    console.log(`Uploading assets for appID ${appId} assets to s3..`)

    if (credentials.errors) throw new Error(credentials.errors)

    await uploadAppAssets({ clientId, appId, instanceId, ...credentials })

    // replicate the DB to the couchDB cluster in prod
    console.log("Replicating local PouchDB to remote..")
    await replicateCouch({
      instanceId,
      clientId,
      credentials: credentials.couchDbCreds,
    })

    await updateDeploymentQuota(credentials.quota)

    await storeLocalDeploymentHistory({
      _id: deploymentId,
      instanceId,
      quota: credentials.quota,
      status: "SUCCESS",
    })
  } catch (err) {
    await storeLocalDeploymentHistory({
      _id: deploymentId,
      instanceId,
      status: "FAILURE",
      err: err.message,
    })
    throw new Error(`Deployment Failed: ${err.message}`)
  }
}

exports.fetchDeployments = async function(ctx) {
  try {
    const db = new PouchDB(ctx.user.instanceId)
    const deploymentDoc = await db.get("_local/deployments")
    ctx.body = Object.values(deploymentDoc.history)
  } catch (err) {
    ctx.body = []
  }
}

exports.deploymentProgress = async function(ctx) {
  try {
    const db = new PouchDB(ctx.user.instanceId)
    const deploymentDoc = await db.get("_local/deployments")
    ctx.body = deploymentDoc[ctx.params.deploymentId]
  } catch (err) {
    ctx.throw(
      500,
      `Error fetching data for deployment ${ctx.params.deploymentId}`
    )
  }
}

exports.deployApp = async function(ctx) {
  const clientAppLookupDB = new PouchDB("client_app_lookup")
  const { clientId } = await clientAppLookupDB.get(ctx.user.appId)

  const deployment = await storeLocalDeploymentHistory({
    instanceId: ctx.user.instanceId,
    appId: ctx.user.appId,
    status: "PENDING",
  })

  deployApp({
    ...ctx.user,
    clientId,
    deploymentId: deployment._id,
  })

  ctx.body = deployment

  //   const instanceQuota = await getCurrentInstanceQuota(ctx.user.instanceId)
  //   const credentials = await verifyDeployment({
  //     instanceId: ctx.user.instanceId,
  //     appId: ctx.user.appId,
  //     quota: instanceQuota,
  //   })

  //   ctx.log.info(`Uploading assets for appID ${ctx.user.appId} assets to s3..`)

  //   if (credentials.errors) {
  //     ctx.throw(500, credentials.errors)
  //     return
  //   }

  //   await uploadAppAssets({
  //     clientId,
  //     appId: ctx.user.appId,
  //     instanceId: ctx.user.instanceId,
  //     ...credentials,
  //   })

  //   // replicate the DB to the couchDB cluster in prod
  //   ctx.log.info("Replicating local PouchDB to remote..")
  //   await replicateCouch({
  //     instanceId: ctx.user.instanceId,
  //     clientId,
  //     credentials: credentials.couchDbCreds,
  //   })

  //   await updateDeploymentQuota(credentials.quota)

  //   const deployment = await storeLocalDeploymentHistory({
  //     quota: credentials.quota,
  //     status: "SUCCESS",
  //   })

  //   ctx.body = {
  //     status: "SUCCESS",
  //     completed: Date.now(),
  //   }
  // } catch (err) {
  //   ctx.throw(err.status || 500, `Deployment Failed: ${err.message}`)
  //   await storeLocalDeploymentHistory({
  //     appId: ctx.user.appId,
  //     instanceId: ctx.user.instanceId,
  //     status: "FAILURE",
  //   })
  // }
}
