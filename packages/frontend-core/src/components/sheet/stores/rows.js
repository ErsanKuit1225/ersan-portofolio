import { writable, derived, get } from "svelte/store"
import { fetchData } from "../../../fetch/fetchData"
import { notifications } from "@budibase/bbui"

export const createRowsStore = context => {
  const { tableId, API, scroll, validation } = context
  const rows = writable([])
  const table = writable(null)
  const filter = writable([])
  const loaded = writable(false)
  const instanceLoaded = writable(false)
  const fetch = writable(null)
  const initialSortState = {
    column: null,
    order: "ascending",
  }
  const sort = writable(initialSortState)

  // Enrich rows with an index property
  const enrichedRows = derived(
    rows,
    $rows => {
      return $rows.map((row, idx) => ({
        ...row,
        __idx: idx,
      }))
    },
    []
  )

  // Generate a lookup map to quick find a row by ID
  const rowLookupMap = derived(
    rows,
    $rows => {
      let map = {}
      for (let i = 0; i < $rows.length; i++) {
        map[$rows[i]._id] = i
      }
      return map
    },
    {}
  )

  // Local cache of row IDs to speed up checking if a row exists
  let rowCacheMap = {}

  // Reset everything when table ID changes
  let unsubscribe = null
  tableId.subscribe($tableId => {
    // Unsub from previous fetch if one exists
    unsubscribe?.()
    fetch.set(null)
    instanceLoaded.set(false)

    // Reset state
    sort.set(initialSortState)
    filter.set([])

    // Create new fetch model
    const newFetch = fetchData({
      API,
      datasource: {
        type: "table",
        tableId: $tableId,
      },
      options: {
        filter: [],
        sortColumn: initialSortState.column,
        sortOrder: initialSortState.order,
        limit: 100,
        paginate: true,
      },
    })

    // Subscribe to changes of this fetch model
    unsubscribe = newFetch.subscribe($fetch => {
      if ($fetch.loaded && !$fetch.loading) {
        const resetRows = $fetch.pageNumber === 0

        // Reset scroll state when data changes
        if (!get(instanceLoaded)) {
          // Reset both top and left for a new table ID
          instanceLoaded.set(true)
          scroll.set({ top: 0, left: 0 })
        } else if (resetRows) {
          // Only reset top scroll position when resetting rows
          scroll.update(state => ({ ...state, top: 0 }))
        }

        // Update table definition
        table.set($fetch.definition)

        // Process new rows
        handleNewRows($fetch.rows, resetRows)

        // Notify that we're loaded
        loaded.set(true)
      }
    })

    fetch.set(newFetch)
  })

  // Update fetch when filter or sort config changes
  filter.subscribe($filter => {
    get(fetch)?.update({
      filter: $filter,
    })
  })
  sort.subscribe($sort => {
    get(fetch)?.update({
      sortOrder: $sort.order,
      sortColumn: $sort.column,
    })
  })

  // Gets a row by ID
  const getRow = id => {
    const index = get(rowLookupMap)[id]
    return index >= 0 ? get(enrichedRows)[index] : null
  }

  // Handles validation errors from the rows API and updates local validation
  // state, storing error messages against relevant cells
  const handleValidationError = (rowId, error) => {
    if (error?.json?.validationErrors) {
      for (let column of Object.keys(error.json.validationErrors)) {
        validation.actions.setError(
          `${rowId}-${column}`,
          `${column} ${error.json.validationErrors[column]}`
        )
      }
    } else {
      notifications.error(`Error saving row: ${error?.message}`)
    }
  }

  // Adds a new row
  const addRow = async (row, idx) => {
    try {
      // Create row
      const newRow = await API.saveRow({ ...row, tableId: get(tableId) })

      // Update state
      if (idx != null) {
        rowCacheMap[newRow._id] = true
        rows.update(state => {
          state.splice(idx, 0, newRow)
          return state.slice()
        })
      } else {
        handleNewRows([newRow])
      }
      notifications.success("Row created successfully")
      return newRow
    } catch (error) {
      handleValidationError("new", error)
    }
  }

  // Refreshes a specific row, handling updates, addition or deletion
  const refreshRow = async id => {
    // Fetch row from the server again
    const res = await API.searchTable({
      tableId: get(tableId),
      limit: 1,
      query: {
        equal: {
          _id: id,
        },
      },
      paginate: false,
    })
    let newRow = res?.rows?.[0]

    // Get index of row to check if it exists
    const $rows = get(rows)
    const $rowLookupMap = get(rowLookupMap)
    const index = $rowLookupMap[id]

    // Process as either an update, addition or deletion
    if (newRow) {
      if (index != null) {
        // An existing row was updated
        rows.update(state => {
          state[index] = { ...newRow }
          return state
        })
      } else {
        // A new row was created
        handleNewRows([newRow])
      }
    } else if (index != null) {
      // A row was removed
      handleRemoveRows([$rows[index]])
    }
  }

  // Refreshes all data
  const refreshData = () => {
    get(fetch)?.getInitialData()
  }

  // Updates a value of a row
  const updateRow = async (rowId, column, value) => {
    const $rows = get(rows)
    const $rowLookupMap = get(rowLookupMap)
    const index = $rowLookupMap[rowId]
    const row = $rows[index]
    if (index == null || row?.[column] === value) {
      return
    }

    // Immediately update state so that the change is reflected
    let newRow = { ...row, [column]: value }
    rows.update(state => {
      state[index] = { ...newRow }
      return state
    })

    // Save change
    delete newRow.__idx
    try {
      await API.saveRow(newRow)
    } catch (error) {
      handleValidationError(newRow._id, error)

      // Revert change
      rows.update(state => {
        state[index] = row
        return state
      })
    }
  }

  // Deletes an array of rows
  const deleteRows = async rowsToDelete => {
    // Actually delete rows
    rowsToDelete.forEach(row => {
      delete row.__idx
    })
    await API.deleteRows({
      tableId: get(tableId),
      rows: rowsToDelete,
    })

    // Update state
    handleRemoveRows(rowsToDelete)
  }

  // Local handler to process new rows inside the fetch, and append any new
  // rows to state that we haven't encountered before
  const handleNewRows = (newRows, resetRows) => {
    if (resetRows) {
      rowCacheMap = {}
    }
    let rowsToAppend = []
    let newRow
    for (let i = 0; i < newRows.length; i++) {
      newRow = newRows[i]
      if (!rowCacheMap[newRow._id]) {
        rowCacheMap[newRow._id] = true
        rowsToAppend.push(newRow)
      }
    }
    if (resetRows) {
      rows.set(rowsToAppend)
    } else if (rowsToAppend.length) {
      rows.update(state => [...state, ...rowsToAppend])
    }
  }

  // Local handler to remove rows from state
  const handleRemoveRows = rowsToRemove => {
    const deletedIds = rowsToRemove.map(row => row._id)

    // We deliberately do not remove IDs from the cache map as the data may
    // still exist inside the fetch, but we don't want to add it again
    rows.update(state => {
      return state.filter(row => !deletedIds.includes(row._id))
    })
  }

  // Loads the next page of data if available
  const loadNextPage = () => {
    get(fetch)?.nextPage()
  }

  // Refreshes the schema of the data fetch subscription
  const refreshTableDefinition = async () => {
    return await get(fetch)?.refreshDefinition()
  }

  // Checks if we have a row with a certain ID
  const hasRow = id => {
    return get(rowLookupMap)[id] != null
  }

  return {
    rows: {
      ...rows,
      subscribe: enrichedRows.subscribe,
      actions: {
        addRow,
        getRow,
        updateRow,
        deleteRows,
        hasRow,
        loadNextPage,
        refreshRow,
        refreshData,
        refreshTableDefinition,
      },
    },
    rowLookupMap,
    table,
    sort,
    filter,
    loaded,
  }
}
