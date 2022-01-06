import {
  DatasourceFieldTypes,
  Integration,
  QueryJson,
  QueryTypes,
} from "../definitions/datasource"
import { IntegrationBase } from "./base/IntegrationBase"
import { OAuth2Client } from "google-auth-library"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { DatasourcePlus } from "./base/datasourcePlus"
import { Table } from "../definitions/common"
import { buildExternalTableId } from "./utils"
import {
  DataSourceOperation,
  FieldTypes,
  DatasourceAuthTypes,
} from "../constants"
import env from "../environment"
import CouchDB from "../db"
import { timeStamp } from "console"

module GoogleSheetsModule {
  interface GoogleSheetsConfig {
    spreadsheetId: string
    auth: OAuthClientConfig
  }

  interface OAuthClientConfig {
    appId: string
    accessToken: string
    refreshToken: string
  }

  const SCHEMA: Integration = {
    plus: true,
    auth: {
      type: "google",
    },
    docs: "https://developers.google.com/sheets/api/quickstart/nodejs",
    description:
      "Create and collaborate on online spreadsheets in real-time and from any device. ",
    friendlyName: "Google Sheets",
    datasource: {
      spreadsheetId: {
        type: DatasourceFieldTypes.STRING,
        required: true,
      },
    },
    query: {
      create: {
        type: QueryTypes.FIELDS,
        fields: {
          sheet: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
          row: {
            type: QueryTypes.JSON,
            required: true,
          },
        },
      },
      read: {
        type: QueryTypes.FIELDS,
        fields: {
          sheet: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
        },
      },
      update: {
        type: QueryTypes.FIELDS,
        fields: {
          sheet: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
          rowIndex: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
          row: {
            type: QueryTypes.JSON,
            required: true,
          },
        },
      },
      delete: {
        type: QueryTypes.FIELDS,
        fields: {
          sheet: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
          rowIndex: {
            type: DatasourceFieldTypes.NUMBER,
            required: true,
          },
        },
      },
    },
  }

  class GoogleSheetsIntegration implements DatasourcePlus {
    private readonly config: GoogleSheetsConfig
    private client: any
    public tables: Record<string, Table> = {}
    public schemaErrors: Record<string, string> = {}

    constructor(config: GoogleSheetsConfig) {
      this.config = config
      this.client = new GoogleSpreadsheet(this.config.spreadsheetId)
    }

    async connect() {
      try {
        // Initialise oAuth client
        // TODO: Move this to auth lib
        const oauthClient = new OAuth2Client({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        })
        oauthClient.credentials.access_token = this.config.auth.accessToken
        oauthClient.credentials.refresh_token = this.config.auth.refreshToken
        this.client.useOAuth2Client(oauthClient)
        await this.client.loadInfo()
      } catch (err) {
        console.error("Error connecting to google sheets", err)
        throw err
      }
    }

    async buildSchema(datasourceId: string, entities: Record<string, Table>) {
      await this.connect()
      const sheets = await this.client.sheetsByIndex
      const tables = {}
      // tables[tableName] = {
      //   _id: buildExternalTableId(datasourceId, tableName),
      //   primary: primaryKeys,
      //   name: tableName,
      //   schema,
      // }
      for (let sheet of sheets) {
        // must fetch rows to determine schema
        await sheet.getRows()
        // build schema
        const schema = {}

        // build schema from headers
        for (let header of sheet.headerValues) {
          schema[header] = {
            name: header,
            type: FieldTypes.STRING,
          }
        }

        // create tables
        tables[sheet.title] = {
          _id: buildExternalTableId(datasourceId, sheet.title),
          name: sheet.title,
          primary: ["rowNumber"],
          schema,
        }
      }

      this.tables = tables
    }

    async query(json: QueryJson) {
      const sheet = json.endpoint.entityId

      if (json.endpoint.operation === DataSourceOperation.CREATE) {
        return await this.create({
          sheet,
          row: json.body,
        })
      }

      if (json.endpoint.operation === DataSourceOperation.READ) {
        return await this.read({ sheet })
      }

      if (json.endpoint.operation === DataSourceOperation.UPDATE) {
        return await this.update({
          sheet,
          row: json.body,
        })
      }

      if (json.endpoint.operation === DataSourceOperation.DELETE) {
        return await this.delete({
          // TODO: complete
        })
      }
    }

    buildRowObject(headers: string[], values: string[], rowNumber: number) {
      const rowObject = { rowNumber }
      for (let i = 0; i < headers.length; i++) {
        rowObject[headers[i]] = values[i]
      }
      return rowObject
    }

    async create(query: { sheet: string; row: string | object }) {
      try {
        await this.connect()
        const sheet = await this.client.sheetsByTitle[query.sheet]
        const rowToInsert =
          typeof query.row === "string" ? JSON.parse(query.row) : query.row
        const row = await sheet.addRow(rowToInsert)
        return [
          this.buildRowObject(sheet.headerValues, row._rawData, row._rowNumber),
        ]
      } catch (err) {
        console.error("Error writing to google sheets", err)
        throw err
      }
    }

    async read(query: { sheet: string }) {
      try {
        await this.connect()
        const sheet = await this.client.sheetsByTitle[query.sheet]
        const rows = await sheet.getRows()
        const headerValues = sheet.headerValues
        const response = []
        for (let row of rows) {
          response.push(
            this.buildRowObject(headerValues, row._rawData, row._rowNumber)
          )
        }
        return response
      } catch (err) {
        console.error("Error reading from google sheets", err)
        throw err
      }
    }

    async update(query: { sheet: string; rowIndex: number; row: string }) {
      try {
        await this.connect()
        const sheet = await this.client.sheetsByTitle[query.sheet]
        const rows = await sheet.getRows()
        const row = rows[query.rowIndex]
        if (row) {
          const updateValues = JSON.parse(query.row)
          for (let key in updateValues) {
            row[key] = updateValues[key]
          }
          await row.save()
          return [
            this.buildRowObject(
              sheet.headerValues,
              row._rawData,
              row._rowNumber
            ),
          ]
        } else {
          throw new Error("Row does not exist.")
        }
      } catch (err) {
        console.error("Error reading from google sheets", err)
        throw err
      }
    }

    async delete(query: { sheet: string; rowIndex: number }) {
      await this.connect()
      const sheet = await this.client.sheetsByTitle[query.sheet]
      const rows = await sheet.getRows()
      const row = rows[query.rowIndex]
      if (row) {
        await row.delete()
        return [{ deleted: query.rowIndex }]
      } else {
        throw new Error("Row does not exist.")
      }
    }
  }

  module.exports = {
    schema: SCHEMA,
    integration: GoogleSheetsIntegration,
  }
}
