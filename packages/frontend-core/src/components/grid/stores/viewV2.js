import { get } from "svelte/store"

const SuppressErrors = true

export const createActions = context => {
  const { definition, API, datasource } = context

  const refreshDefinition = async () => {
    const $datasource = get(datasource)
    if (!$datasource) {
      definition.set(null)
      return
    }
    const table = await API.fetchTableDefinition($datasource.tableId)
    const view = Object.values(table?.views || {}).find(
      view => view.id === $datasource.id
    )
    definition.set(view)
  }

  const saveDefinition = async newDefinition => {
    await API.viewV2.update(newDefinition)
  }

  const saveRow = async row => {
    const $datasource = get(datasource)
    row.tableId = $datasource?.tableId
    row._viewId = $datasource?.id
    return {
      ...(await API.saveRow(row, SuppressErrors)),
      _viewId: row._viewId,
    }
  }

  const deleteRows = async rows => {
    // Ensure we delete _viewId from rows as otherwise this throws a 500
    rows?.forEach(row => {
      delete row?._viewId
    })
    await API.deleteRows({
      tableId: get(datasource).id,
      rows,
    })
  }

  const getRow = () => {
    throw "Views don't support fetching individual rows"
  }

  const isDatasourceValid = datasource => {
    return (
      datasource?.type === "viewV2" && datasource?.id && datasource?.tableId
    )
  }

  return {
    viewV2: {
      actions: {
        refreshDefinition,
        saveDefinition,
        addRow: saveRow,
        updateRow: saveRow,
        deleteRows,
        getRow,
        isDatasourceValid,
      },
    },
  }
}

export const initialise = context => {
  const { definition, datasource, sort, rows, filter, subscribe, viewV2 } =
    context

  // Keep a list of subscriptions so that we can clear them when the datasource
  // config changes
  let unsubscribers = []

  // Observe datasource changes and apply logic for view V2 datasources
  datasource.subscribe($datasource => {
    // Clear previous subscriptions
    unsubscribers?.forEach(unsubscribe => unsubscribe())
    unsubscribers = []
    if (!viewV2.actions.isDatasourceValid($datasource)) {
      return
    }

    // Reset state for new view
    filter.set([])
    sort.set({
      column: null,
      order: "ascending",
    })

    // Keep sort and filter state in line with the view definition
    unsubscribers.push(
      definition.subscribe($definition => {
        if ($definition?.id !== $datasource.id) {
          return
        }
        sort.set({
          column: $definition.sort?.field,
          order: $definition.sort?.order || "ascending",
        })
        filter.set($definition.query || [])
      })
    )

    // When sorting changes, ensure view definition is kept up to date
    unsubscribers.push(
      sort.subscribe(async $sort => {
        // Ensure we're updating the correct view
        const $view = get(definition)
        if ($view?.id !== $datasource.id) {
          return
        }
        if (
          $sort?.column !== $view.sort?.field ||
          $sort?.order !== $view.sort?.order
        ) {
          await datasource.actions.saveDefinition({
            ...$view,
            sort: {
              field: $sort.column,
              order: $sort.order || "ascending",
            },
          })
          await rows.actions.refreshData()
        }
      })
    )

    // When filters change, ensure view definition is kept up to date
    unsubscribers?.push(
      filter.subscribe(async $filter => {
        // Ensure we're updating the correct view
        const $view = get(definition)
        if ($view?.id !== $datasource.id) {
          return
        }
        if (JSON.stringify($filter) !== JSON.stringify($view.query)) {
          await datasource.actions.saveDefinition({
            ...$view,
            query: $filter,
          })
          await rows.actions.refreshData()
        }
      })
    )

    // When hidden we show columns, we need to refresh data in order to fetch
    // values for those columns
    unsubscribers.push(
      subscribe("show-column", async () => {
        await rows.actions.refreshData()
      })
    )
  })
}
