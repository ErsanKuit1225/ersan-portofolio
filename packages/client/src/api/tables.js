import API from "./api"
import { enrichRows } from "./rows"

/**
 * Fetches a table definition.
 * Since definitions cannot change at runtime, the result is cached.
 */
export const fetchTableDefinition = async (tableId) => {
  return await API.get({ url: `/api/tables/${tableId}`, cache: true })
}

/**
 * Fetches all rows from a table.
 */
export const fetchTableData = async (tableId) => {
  const rows = await API.get({ url: `/api/${tableId}/rows` })
  return await enrichRows(rows, tableId)
}

/**
 * Perform a mango query against an internal table
 * @param {String} tableId - id of the table to search
 * @param {Object} search - Mango Compliant search object
 * @param {Object} pagination - the pagination controls
 */
export const searchTableData = async ({ tableId, search, pagination }) => {
  const output = await API.post({
    url: `/api/${tableId}/rows/search`,
    body: {
      query: search,
      pagination,
    },
  })
  output.rows = await enrichRows(output.rows, tableId)
  return output
}

/**
 * Searches a table using Lucene.
 */
export const searchTable = async ({
  tableId,
  query,
  raw,
  bookmark,
  limit,
  sort,
  sortOrder,
}) => {
  if (!tableId || (!query && !raw)) {
    return
  }
  const res = await API.post({
    url: `/api/search/${tableId}/rows`,
    body: {
      query,
      raw,
      bookmark,
      limit,
      sort,
      sortOrder,
    },
  })
  return {
    rows: await enrichRows(res?.rows, tableId),
    bookmark: res.bookmark,
  }
}
