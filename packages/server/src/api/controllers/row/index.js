const internal = require("./internal")
const external = require("./external")

function pickApi(tableId) {
  // TODO: go to external
  return internal
}

function getTableId(ctx) {
  if (ctx.request.body && ctx.request.body.tableId) {
    return ctx.request.body.tableId
  }
  if (ctx.params && ctx.params.tableId) {
    return ctx.params.tableId
  }
  if (ctx.params && ctx.params.viewName) {
    return ctx.params.viewName
  }
}

exports.patch = async ctx => {
  const appId = ctx.appId
  const tableId = getTableId(ctx)
  try {
    const { row, table } = await pickApi(tableId).patch(ctx)
    ctx.eventEmitter && ctx.eventEmitter.emitRow(`row:update`, appId, row, table)
    ctx.message = `${table.name} updated successfully`
    ctx.body = row
  } catch (err) {
    ctx.throw(400, err)
  }
}

exports.save = async function (ctx) {
  // TODO: this used to handle bulk delete, need to update builder/client
  const appId = ctx.appId
  const tableId = getTableId(ctx)
  try {
    const { row, table } = await pickApi(tableId).save(ctx)
    ctx.eventEmitter && ctx.eventEmitter.emitRow(`row:save`, appId, row, table)
    ctx.message = `${table.name} saved successfully`
    ctx.body = row
  } catch (err) {
    ctx.throw(400, err)
  }
}

exports.fetchView = async function (ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).fetchView(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

exports.fetchTableRows = async function (ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).fetchTableRows(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

exports.find = async function (ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).find(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

exports.destroy = async function (ctx) {
  const appId = ctx.appId
  const inputs = ctx.request.body
  const tableId = getTableId(ctx)
  let response, row
  if (inputs.rows) {
    let { rows } = await pickApi(tableId).bulkDestroy(ctx)
    response = rows
    for (let row of rows) {
      ctx.eventEmitter && ctx.eventEmitter.emitRow(`row:delete`, appId, row)
    }
  } else {
    let resp = await pickApi(tableId).destroy(ctx)
    response = resp.response
    row = resp.row
    ctx.eventEmitter && ctx.eventEmitter.emitRow(`row:delete`, appId, row)
  }
  ctx.status = 200
  // for automations include the row that was deleted
  ctx.row = row || {}
  ctx.body = response
}

exports.validate = async function (ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).validate(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}

exports.fetchEnrichedRow = async function (ctx) {
  const tableId = getTableId(ctx)
  try {
    ctx.body = await pickApi(tableId).fetchEnrichedRow(ctx)
  } catch (err) {
    ctx.throw(400, err)
  }
}