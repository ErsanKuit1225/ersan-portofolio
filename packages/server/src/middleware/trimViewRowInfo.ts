import { Ctx, Row } from "@budibase/types"
import * as utils from "../db/utils"
import sdk from "../sdk"
import { db } from "@budibase/backend-core"

export default () => async (ctx: Ctx<Row>, next: any) => {
  const { body } = ctx.request
  const { _viewId: viewId } = body
  if (!viewId) {
    ctx.throw(400, "_viewId is required")
  }

  const { tableId } = utils.extractViewInfoFromID(viewId)
  const { _viewId, ...trimmedView } = await trimViewFields(
    viewId,
    tableId,
    body
  )
  ctx.request.body = trimmedView
  ctx.params.tableId = body.tableId

  return next()
}

export async function trimViewFields<T extends Row>(
  viewId: string,
  tableId: string,
  data: T
): Promise<T> {
  const view = await sdk.views.get(viewId)
  if (!view?.columns || !Object.keys(view.columns).length) {
    return data
  }

  const table = await sdk.tables.getTable(tableId)
  const { schema } = sdk.views.enrichSchema(view!, table.schema)
  const result: Record<string, any> = {}
  for (const key of [
    ...Object.keys(schema),
    ...db.CONSTANT_EXTERNAL_ROW_COLS,
    ...db.CONSTANT_INTERNAL_ROW_COLS,
  ]) {
    result[key] = data[key] !== null ? data[key] : undefined
  }

  return result as T
}
