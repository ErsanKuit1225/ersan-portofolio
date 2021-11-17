import {
  Integration,
  DatasourceFieldTypes,
  QueryTypes,
  SqlQuery,
  QueryJson
} from "../definitions/datasource"
import { finaliseExternalTables, getSqlQuery, buildExternalTableId, convertType } from "./utils"
import oracledb, { ExecuteOptions, Result,  Connection, ConnectionAttributes, BindParameters } from "oracledb"
import Sql from "./base/sql"
import { Table } from "../definitions/common"
import { DatasourcePlus } from "./base/datasourcePlus"
import { FieldTypes } from "../constants"

module OracleModule {

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  interface OracleConfig {
    host: string
    port: number
    database: string
    user: string
    password: string
  }

  const SCHEMA: Integration = {
    docs: "https://github.com/oracle/node-oracledb",
    plus: true,
    friendlyName: "Oracle",
    description: "Oracle Database is an object-relational database management system developed by Oracle Corporation",
    datasource: {
      host: {
        type: DatasourceFieldTypes.STRING,
        default: "localhost",
        required: true,
      },
      port: {
        type: DatasourceFieldTypes.NUMBER,
        required: true,
        default: 1521,
      },
      database: {
        type: DatasourceFieldTypes.STRING,
        required: true,
      },
      user: {
        type: DatasourceFieldTypes.STRING,
        required: true,
      },
      password: {
        type: DatasourceFieldTypes.PASSWORD,
        required: true,
      }
    },
    query: {
      create: {
        type: QueryTypes.SQL,
      },
      read: {
        type: QueryTypes.SQL,
      },
      update: {
        type: QueryTypes.SQL,
      },
      delete: {
        type: QueryTypes.SQL,
      },
    },
  }

  const TYPE_MAP = {
    text: FieldTypes.LONGFORM,
    blob: FieldTypes.LONGFORM,
    enum: FieldTypes.STRING,
    varchar: FieldTypes.STRING,
    float: FieldTypes.NUMBER,
    int: FieldTypes.NUMBER,
    numeric: FieldTypes.NUMBER,
    bigint: FieldTypes.NUMBER,
    mediumint: FieldTypes.NUMBER,
    decimal: FieldTypes.NUMBER,
    dec: FieldTypes.NUMBER,
    double: FieldTypes.NUMBER,
    real: FieldTypes.NUMBER,
    fixed: FieldTypes.NUMBER,
    smallint: FieldTypes.NUMBER,
    timestamp: FieldTypes.DATETIME,
    date: FieldTypes.DATETIME,
    datetime: FieldTypes.DATETIME,
    time: FieldTypes.DATETIME,
    tinyint: FieldTypes.BOOLEAN,
    json: DatasourceFieldTypes.JSON,
  }

  /**
   * Raw query response
   */
  interface ColumnsResponse {
    TABLE_NAME: string
    COLUMN_NAME: string
    DATA_TYPE: string
    COLUMN_ID: number
    CONSTRAINT_NAME: string | null
    CONSTRAINT_TYPE: string | null
    R_CONSTRAINT_NAME: string | null
    SEARCH_CONDITION: string | null
  }

  /**
   * An oracle constraint
   */
  interface OracleConstraint {
    name: string
    type: string 
    relatedConstraintName: string | null
    searchCondition: string | null
  }

  /**
   * An oracle column and it's related constraints
   */
  interface OracleColumn {
    name: string
    type: string
    id: number
    constraints: {[key: string]: OracleConstraint }
  }

  /**
   * An oracle table and it's related columns
   */
  interface OracleTable {
    name: string
    columns: {[key: string]: OracleColumn }
  }

  const OracleContraintTypes = {
    PRIMARY: "P",
    NOT_NULL_OR_CHECK: "C",
    FOREIGN_KEY: "R",
    UNIQUE: "U"
  }

  class OracleIntegration extends Sql implements DatasourcePlus {

    private readonly config: OracleConfig

    public tables: Record<string, Table> = {}
    public schemaErrors: Record<string, string> = {}

    private readonly COLUMNS_SQL = `
      SELECT
        tabs.table_name,
        cols.column_name,
        cols.data_type,
        cols.column_id,
        cons.constraint_name,
        cons.constraint_type,
        cons.r_constraint_name,
        cons.search_condition
      FROM
        user_tables tabs
      JOIN 
        user_tab_columns cols
        ON tabs.table_name = cols.table_name 
      LEFT JOIN 
        user_cons_columns col_cons
        ON cols.column_name = col_cons.column_name
        AND cols.table_name = col_cons.table_name
      LEFT JOIN 
        user_constraints cons
        ON col_cons.constraint_name = cons.constraint_name
        AND cons.table_name = cols.table_name
      WHERE
        (cons.status = 'ENABLED'
          OR cons.status IS NULL)
    `
    constructor(config: OracleConfig) {
      super("oracledb")
      this.config = config
    }

    /**
     * Map the flat tabular columns and constraints data into a nested object 
     */
    private mapColumns(result: Result<ColumnsResponse>): { [key: string]: OracleTable } {
      const oracleTables: { [key: string]: OracleTable } = {}

      if (result.rows) {
        result.rows.forEach(row => {
          const tableName = row.TABLE_NAME
          const columnName = row.COLUMN_NAME
          const dataType = row.DATA_TYPE
          const columnId = row.COLUMN_ID
          const constraintName = row.CONSTRAINT_NAME
          const constraintType = row.CONSTRAINT_TYPE
          const relatedConstraintName = row.R_CONSTRAINT_NAME
          const searchCondition = row.SEARCH_CONDITION

          let table = oracleTables[tableName]
          if (!table) {
            table = {
              name: tableName,
              columns: {}
            }
            oracleTables[tableName] = table
          }

          let column = table.columns[columnName]
          if (!column) {
            column = {
              name: columnName,
              type: dataType,
              id: columnId,
              constraints: {}
            }
            table.columns[columnName] = column
          }

          if (constraintName && constraintType) {
            let constraint = column.constraints[constraintName]
            if (!constraint) {
              constraint = {
                name: constraintName,
                type: constraintType,
                relatedConstraintName: relatedConstraintName,
                searchCondition: searchCondition
              }
            }
            column.constraints[constraintName] = constraint
          }
        })
      }

      return oracleTables
    }

    /**
     * Fetches the tables from the oracle table and assigns them to the datasource.
     * @param {*} datasourceId - datasourceId to fetch
     * @param entities - the tables that are to be built
    */
    async buildSchema(datasourceId: string, entities: Record<string, Table>) {
      const columnsResponse = await this.internalQuery<ColumnsResponse>({ sql: this.COLUMNS_SQL })
      const oracleTables = this.mapColumns(columnsResponse)

      const tables: { [key: string]: Table } = {}

      // iterate each table
      Object.values(oracleTables).forEach(oracleTable => {
        let table = tables[oracleTable.name]
        if (!table) {
          table = {
            _id: buildExternalTableId(datasourceId, oracleTable.name),
            primary: [],
            name: oracleTable.name,
            schema: {},
          }
          tables[oracleTable.name] = table
        }

        // iterate each column on the table
        Object.values(oracleTable.columns)
              // match the order of the columns in the db
              .sort((c1, c2) => c1.id - c2.id)
              .forEach(oracleColumn => {
          const columnName = oracleColumn.name
          let fieldSchema = table.schema[columnName]
          if (!fieldSchema) {
            fieldSchema = {
              autocolumn: false,
              name: columnName,
              type: convertType(oracleColumn.type, TYPE_MAP),
            }
            table.schema[columnName] = fieldSchema
          }

          // iterate each constraint on the column
          Object.values(oracleColumn.constraints).forEach(oracleConstraint => {
            if (oracleConstraint.type === OracleContraintTypes.PRIMARY) {
              table.primary!.push(columnName)
            }
          })
        })
      })

      const final = finaliseExternalTables(tables, entities)
      this.tables = final.tables
      this.schemaErrors = final.errors
    }


    private async internalQuery<T>(query: SqlQuery): Promise<Result<T>> {
    let connection
    try {
      connection = await this.getConnection()

        const options: ExecuteOptions = { autoCommit: true }
        const bindings: BindParameters = query.bindings || []
        const result: Result<T> = await connection.execute<T>(query.sql, bindings, options)

        return result
      } finally {
       if (connection) {
         try {
           await connection.close();
         } catch (err) {
           console.error(err);
         }
       }
      }
    }

    private getConnection = async (): Promise<Connection> => {
      //connectString : "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA =(SID= ORCL)))"
      const connectString = `${this.config.host}:${this.config.port || 1521}/${this.config.database}`
      const attributes: ConnectionAttributes = {
        user: this.config.user,
        password: this.config.user,
        connectString,
      }
      return oracledb.getConnection(attributes);
    }

    async create(query: SqlQuery | string) {
      const response = await this.internalQuery(getSqlQuery(query))
      return response.rows && response.rows.length ? response.rows : [{ created: true }]
    }

    async read(query: SqlQuery | string) {
      const response = await this.internalQuery(getSqlQuery(query))
      return response.rows
    }

    async update(query: SqlQuery | string) {
      const response = await this.internalQuery(getSqlQuery(query))
      return response.rows && response.rows.length ? response.rows : [{ updated: true }]
    }

    async delete(query: SqlQuery | string) {
      const response = await this.internalQuery(getSqlQuery(query))
      return response.rows && response.rows.length ? response.rows : [{ deleted: true }]
    }

    async query(json: QueryJson) {
      const operation = this._operation(json).toLowerCase()
      const input = this._query(json)
      if (Array.isArray(input)) {
        const responses = []
        for (let query of input) {
          responses.push(await this.internalQuery(query))
        }
        return responses
      } else {
        const response = await this.internalQuery(input)
        return response.rows && response.rows.length ? response.rows : [{ [operation]: true }]
      }
    }
  }

  module.exports = {
    schema: SCHEMA,
    integration: OracleIntegration,
  }
}
