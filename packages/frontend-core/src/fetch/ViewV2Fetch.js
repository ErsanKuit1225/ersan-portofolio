import DataFetch from "./DataFetch.js"
import { get } from "svelte/store"

export default class ViewV2Fetch extends DataFetch {
  determineFeatureFlags() {
    return {
      // The API does not actually support dynamic filtering, but since views
      // have filters built in we don't want to perform client side filtering
      // which would happen if we marked this as false
      supportsSearch: true,
      supportsSort: true,
      supportsPagination: true,
    }
  }

  getSchema(datasource, definition) {
    return definition?.schema
  }

  async getDefinition(datasource) {
    try {
      const table = await this.API.fetchTableDefinition(datasource.tableId)
      return Object.values(table.views || {}).find(
        view => view.id === datasource.id
      )
    } catch (error) {
      this.store.update(state => ({
        ...state,
        error,
      }))
      return null
    }
  }

  async getData() {
    const { datasource, limit, sortColumn, sortOrder, sortType, paginate } =
      this.options
    const { cursor } = get(this.store)
    try {
      const res = await this.API.viewV2.fetch({
        viewId: datasource.id,
        paginate,
        limit,
        bookmark: cursor,
        sort: sortColumn,
        sortOrder,
        sortType,
      })
      return {
        rows: res?.rows || [],
        hasNextPage: res?.hasNextPage || false,
        cursor: res?.bookmark || null,
      }
    } catch (error) {
      return {
        rows: [],
        hasNextPage: false,
        error,
      }
    }
  }
}
