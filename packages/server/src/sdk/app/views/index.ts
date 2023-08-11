import {
  FieldSchema,
  RenameColumn,
  TableSchema,
  View,
  ViewV2,
} from "@budibase/types"
import { context, HTTPError } from "@budibase/backend-core"

import sdk from "../../../sdk"
import * as utils from "../../../db/utils"

export async function get(viewId: string): Promise<ViewV2 | undefined> {
  const { tableId } = utils.extractViewInfoFromID(viewId)
  const table = await sdk.tables.getTable(tableId)
  const views = Object.values(table.views!)
  return views.find(v => isV2(v) && v.id === viewId) as ViewV2 | undefined
}

export async function create(
  tableId: string,
  viewRequest: Omit<ViewV2, "id" | "version">
): Promise<ViewV2> {
  const view: ViewV2 = {
    ...viewRequest,
    id: utils.generateViewID(tableId),
    version: 2,
  }

  const db = context.getAppDB()
  const table = await sdk.tables.getTable(tableId)
  table.views ??= {}

  table.views[view.name] = view
  await db.put(table)
  return view
}

export async function update(tableId: string, view: ViewV2): Promise<ViewV2> {
  const db = context.getAppDB()
  const table = await sdk.tables.getTable(tableId)
  table.views ??= {}

  const existingView = Object.values(table.views).find(
    v => isV2(v) && v.id === view.id
  )
  if (!existingView) {
    throw new HTTPError(`View ${view.id} not found in table ${tableId}`, 404)
  }

  console.log("set to", view)
  delete table.views[existingView.name]
  table.views[view.name] = view
  await db.put(table)
  return view
}

export function isV2(view: View | ViewV2): view is ViewV2 {
  return (view as ViewV2).version === 2
}

export async function remove(viewId: string): Promise<ViewV2> {
  const db = context.getAppDB()

  const view = await get(viewId)
  const table = await sdk.tables.getTable(view?.tableId)
  if (!view) {
    throw new HTTPError(`View ${viewId} not found`, 404)
  }

  delete table.views![view?.name]
  await db.put(table)
  return view
}

export function enrichSchema(view: View | ViewV2, tableSchema: TableSchema) {
  if (!sdk.views.isV2(view)) {
    return view
  }

  let schema = { ...tableSchema }
  const anyViewOrder = Object.values(view.schema || {}).some(
    ui => ui.order != null
  )
  if (Object.keys(view.schema || {}).length > 0) {
    for (const key of Object.keys(schema)) {
      // if nothing specified in view, then it is not visible
      const ui = view.schema?.[key] || { visible: false }
      if (ui.visible === false) {
        schema[key].visible = false
      } else {
        schema[key] = {
          ...schema[key],
          ...ui,
          order: anyViewOrder ? ui?.order ?? undefined : schema[key].order,
        }
      }
    }
  }

  return {
    ...view,
    schema: schema,
  }
}

export function syncSchema(
  view: ViewV2,
  schema: TableSchema,
  renameColumn: RenameColumn | undefined
): ViewV2 {
  if (renameColumn && view.schema) {
    view.schema[renameColumn.updated] = view.schema[renameColumn.old]
    delete view.schema[renameColumn.old]
  }

  if (view.schema) {
    for (const fieldName of Object.keys(view.schema)) {
      if (!schema[fieldName]) {
        delete view.schema[fieldName]
      }
    }
    for (const fieldName of Object.keys(schema)) {
      if (!view.schema[fieldName]) {
        view.schema[fieldName] = { visible: false }
      }
    }
  }

  return view
}
