const rowController = require("../../../controllers/row")
const appController = require("../../../controllers/application")
const CouchDB = require("../../../../db")

function Request(appId, params) {
  this.user = { appId }
  this.params = params
}

exports.getAllTableRows = async (appId, tableId) => {
  const req = new Request(appId, { tableId })
  await rowController.fetchTableRows(req)
  return req.body
}

exports.clearAllApps = async () => {
  const req = {}
  await appController.fetch(req)
  const apps = req.body
  if (!apps || apps.length <= 0) {
    return
  }
  for (let app of apps) {
    const appId = app._id
    await appController.delete(new Request(null, { appId }))
  }
}

exports.createRequest = (request, method, url, body) => {
  let req

  if (method === "POST") req = request.post(url).send(body)
  else if (method === "GET") req = request.get(url)
  else if (method === "DELETE") req = request.delete(url)
  else if (method === "PATCH") req = request.patch(url).send(body)
  else if (method === "PUT") req = request.put(url).send(body)

  return req
}

exports.checkBuilderEndpoint = async ({
  config,
  request,
  method,
  url,
  body,
}) => {
  const headers = await config.login()
  await exports
    .createRequest(request, method, url, body)
    .set(headers)
    .expect(403)
}

/**
 * Raw DB insert utility.
 */
exports.insertDocument = async (databaseId, document) => {
  const { id, ...documentFields } = document
  return await new CouchDB(databaseId).put({ _id: id, ...documentFields })
}

/**
 * Raw DB delete utility.
 */
exports.destroyDocument = async (databaseId, documentId) => {
  return await new CouchDB(databaseId).destroy(documentId)
}

/**
 * Raw DB get utility.
 */
exports.getDocument = async (databaseId, documentId) => {
  return await new CouchDB(databaseId).get(documentId)
}
