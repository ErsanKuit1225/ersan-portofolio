import { writable, derived } from "svelte/store"
import { tables } from "./"
import { API } from "api"

export function createViewsV2Store() {
  const store = writable({
    selectedViewId: null,
  })
  const derivedStore = derived([store, tables], ([$store, $tables]) => {
    let list = []
    $tables.list?.forEach(table => {
      const views = Object.values(table?.views || {}).filter(view => {
        return view.version === 2
      })
      list = list.concat(views)
    })
    return {
      ...$store,
      list,
      selected: list.find(view => view.id === $store.selectedViewId),
    }
  })

  const select = id => {
    store.update(state => ({
      ...state,
      selectedViewId: id,
    }))
  }

  const deleteView = async view => {
    await API.viewV2.delete(view.id)

    // Update tables
    tables.update(state => {
      const table = state.list.find(table => table._id === view.tableId)
      delete table.views[view.name]
      return { ...state }
    })
  }

  const create = async view => {
    const savedViewResponse = await API.viewV2.create(view)
    const savedView = savedViewResponse.data

    // Update tables
    tables.update(state => {
      const table = state.list.find(table => table._id === view.tableId)
      table.views[view.name] = savedView
      return { ...state }
    })

    return savedView
  }

  const save = async view => {
    // No dedicated save endpoint at this time
    // const savedView = await API.saveView(view)
    //
    // // Update tables
    // tables.update(state => {
    //   const table = state.list.find(table => table._id === view.tableId)
    //   if (table) {
    //     if (view.originalName) {
    //       delete table.views[view.originalName]
    //     }
    //     table.views[view.name] = savedView
    //   }
    //   return { ...state }
    // })
  }

  const replace = (id, view) => {}

  return {
    subscribe: derivedStore.subscribe,
    select,
    delete: deleteView,
    create,
    save,
    replace,
  }
}

export const viewsV2 = createViewsV2Store()
