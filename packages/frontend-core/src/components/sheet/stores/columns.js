import { derived, get, writable } from "svelte/store"
import { cloneDeep } from "lodash/fp"

export const DefaultColumnWidth = 200

export const createStores = () => {
  const columns = writable([])
  const stickyColumn = writable(null)

  // Derive an enriched version of columns with left offsets and indexes
  // automatically calculated
  const enrichedColumns = derived(
    columns,
    $columns => {
      let offset = 0
      return $columns.map((column, idx) => {
        const enriched = {
          ...column,
          left: offset,
        }
        if (column.visible) {
          offset += column.width
        }
        return enriched
      })
    },
    []
  )

  // Derived list of columns which have not been explicitly hidden
  const visibleColumns = derived(
    enrichedColumns,
    $columns => {
      return $columns.filter(col => col.visible)
    },
    []
  )

  return {
    columns: {
      ...columns,
      subscribe: enrichedColumns.subscribe,
    },
    stickyColumn,
    visibleColumns,
  }
}

export const deriveStores = context => {
  const { table, gutterWidth, columns, stickyColumn, API, dispatch } = context

  // Merge new schema fields with existing schema in order to preserve widths
  table.subscribe($table => {
    const schema = $table?.schema
    if (!schema) {
      columns.set([])
      stickyColumn.set(null)
      return
    }
    const currentColumns = get(columns)
    const currentStickyColumn = get(stickyColumn)

    // Find primary display
    let primaryDisplay
    if ($table.primaryDisplay && schema[$table.primaryDisplay]) {
      primaryDisplay = $table.primaryDisplay
    }

    // Get field list
    let fields = []
    Object.keys(schema).forEach(field => {
      if (field !== primaryDisplay) {
        fields.push(field)
      }
    })

    // Update columns, removing extraneous columns and adding missing ones
    columns.set(
      fields
        .map(field => ({
          name: field,
          width: schema[field].width || DefaultColumnWidth,
          schema: schema[field],
          visible: schema[field].visible ?? true,
          order: schema[field].order,
        }))
        .sort((a, b) => {
          // Sort by order first
          const orderA = a.order
          const orderB = b.order
          if (orderA != null && orderB != null) {
            return orderA < orderB ? -1 : 1
          } else if (orderA != null) {
            return -1
          } else if (orderB != null) {
            return 1
          }

          // Then sort by auto columns
          const autoColA = a.schema?.autocolumn
          const autoColB = b.schema?.autocolumn
          if (autoColA === autoColB) {
            return 0
          }
          return autoColA ? 1 : -1
        })
    )

    // Update sticky column
    if (!primaryDisplay) {
      stickyColumn.set(null)
      return
    }

    // Check if there is an existing column with this name so we can keep
    // the width setting
    let existing = currentColumns.find(x => x.name === primaryDisplay)
    if (!existing && currentStickyColumn?.name === primaryDisplay) {
      existing = currentStickyColumn
    }
    stickyColumn.set({
      name: primaryDisplay,
      width:
        existing?.width || schema[primaryDisplay].width || DefaultColumnWidth,
      left: gutterWidth,
      schema: schema[primaryDisplay],
      idx: "sticky",
    })
  })

  // Updates a columns width
  const updateColumnWidth = async (columnName, width) => {
    const $table = get(table)
    await updateTable({
      ...$table,
      schema: {
        ...$table.schema,
        [columnName]: {
          ...$table.schema[columnName],
          width,
        },
      },
    })
  }

  // Updates a columns visibility
  const updateColumnVisibility = async (columnName, visible) => {
    const $table = get(table)
    await updateTable({
      ...$table,
      schema: {
        ...$table.schema,
        [columnName]: {
          ...$table.schema[columnName],
          visible,
        },
      },
    })
  }

  // Updates the orders of columns
  const updateColumnOrders = async newColumns => {
    const $table = get(table)
    const newSchema = cloneDeep($table.schema)
    Object.keys(newSchema).forEach(column => {
      const index = newColumns.indexOf(column)
      if (index !== -1) {
        newSchema[column].order = index
      } else {
        delete newSchema[column].order
      }
    })
    await updateTable({
      ...$table,
      schema: newSchema,
    })
  }

  // Updates the table definition
  const updateTable = async newTable => {
    table.set(newTable)
    dispatch("updatetable", newTable)
    await API.saveTable(newTable)
  }

  return {
    columns: {
      ...columns,
      actions: {
        updateColumnWidth,
        updateColumnVisibility,
        updateColumnOrders,
      },
    },
  }
}
