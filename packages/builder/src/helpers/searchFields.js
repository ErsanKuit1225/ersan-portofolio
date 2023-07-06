import { tables } from "../stores/backend"
import { BannedSearchTypes } from "../constants/backend"
import { get } from "svelte/store"

export function getTableFields(linkField) {
  const table = get(tables).list.find(table => table._id === linkField.tableId)
  if (!table) {
    return []
  }
  const linkFields = getFields(Object.values(table.schema), {
    tableFields: true,
  })
  return linkFields.map(field => ({
    ...field,
    name: `${table.name}.${field.name}`,
  }))
}

export function getFields(fields, { tableFields }) {
  let filteredFields = fields.filter(
    field => !BannedSearchTypes.includes(field.type)
  )
  if (!tableFields) {
    const linkFields = fields.filter(field => field.type === "link")
    for (let linkField of linkFields) {
      // only allow one depth of SQL relationship filtering
      filteredFields = filteredFields.concat(getTableFields(linkField))
    }
  }
  const staticFormulaFields = fields.filter(
    field => field.type === "formula" && field.formulaType === "static"
  )
  return filteredFields.concat(staticFormulaFields)
}
