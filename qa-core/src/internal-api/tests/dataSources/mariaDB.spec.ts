import TestConfiguration from "../../config/TestConfiguration"
import * as fixtures from "../../fixtures"

describe("Internal API - Data Sources: MariaDB", () => {
  const config = new TestConfiguration()

  beforeAll(async () => {
    await config.beforeAll()
  })

  afterAll(async () => {
    await config.afterAll()
  })

  it("Create an app with a data source - MariaDB", async () => {
    // Create app
    await config.createApp()

    // Add data source
    const [dataSourceResponse, dataSourceJson] =
      await config.api.datasources.add(fixtures.datasources.mariaDB())

    // Update data source
    const newDataSourceInfo = {
      ...dataSourceJson.datasource,
      name: "MariaDB2",
    }
    const [updatedDataSourceResponse, updatedDataSourceJson] =
      await config.api.datasources.update(newDataSourceInfo)

    const dataSourceQuery = {
      datasourceId: updatedDataSourceJson.datasource._id,
      fields: {
        sql: "SELECT * FROM employees;",
      },
      name: "Query 1",
      parameters: {},
      queryVerb: "read",
      schema: {},
      transformer: "return data",
    }
    // Query data source

    const [queryResponse, queryJson] =
      await config.api.datasources.previewQuery(dataSourceQuery)

    // Save query
    const datasourcetoSave = {
      ...dataSourceQuery,
      parameters: [],
    }

    const [saveQueryResponse, saveQueryJson] =
      await config.api.datasources.saveQuery(datasourcetoSave)
    // Get Query
    const [getQueryResponse, getQueryJson] =
      await config.api.datasources.getQuery(<string>saveQueryJson._id)

    // Get Query permissions
    const [getQueryPermissionsResponse, getQueryPermissionsJson] =
      await config.api.datasources.getQueryPermissions(
        <string>saveQueryJson._id
      )

    // Delete data source
    const deleteResponse = await config.api.datasources.delete(
      <string>updatedDataSourceJson.datasource._id,
      <string>updatedDataSourceJson.datasource._rev
    )
  })
})
