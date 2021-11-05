import {
  Integration,
  DatasourceFieldTypes,
  QueryTypes,
  QueryJson,
  SqlQuery,
} from "../definitions/datasource"
import { getSqlQuery } from "./utils"
import { DatasourcePlus } from "./base/datasourcePlus"
import { Table, TableSchema } from "../definitions/common"

module MSSQLModule {
  const sqlServer = require("mssql")
  const Sql = require("./base/sql")
  const { FieldTypes } = require("../constants")
  const {
    buildExternalTableId,
    convertType,
    finaliseExternalTables,
  } = require("./utils")

  interface MSSQLConfig {
    user: string
    password: string
    server: string
    port: number
    database: string
    encrypt?: boolean
  }

  const SCHEMA: Integration = {
    docs: "https://github.com/tediousjs/node-mssql",
    plus: true,
    description:
      "Microsoft SQL Server is a relational database management system developed by Microsoft. ",
    friendlyName: "MS SQL Server",
    datasource: {
      user: {
        type: DatasourceFieldTypes.STRING,
        required: true,
        default: "localhost",
      },
      password: {
        type: DatasourceFieldTypes.PASSWORD,
        required: true,
      },
      server: {
        type: DatasourceFieldTypes.STRING,
        default: "localhost",
      },
      port: {
        type: DatasourceFieldTypes.NUMBER,
        required: false,
        default: 1433,
      },
      database: {
        type: DatasourceFieldTypes.STRING,
        default: "root",
      },
      encrypt: {
        type: DatasourceFieldTypes.BOOLEAN,
        default: true,
      },
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

  // TODO: need to update this
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

  async function internalQuery(client: any, query: SqlQuery) {
    try {
      if (Array.isArray(query.bindings)) {
        let count = 0
        for (let binding of query.bindings) {
          client.input(`p${count++}`, binding)
        }
      }
      return await client.query(query.sql)
    } catch (err) {
      // @ts-ignore
      throw new Error(err)
    }
  }

  class SqlServerIntegration extends Sql implements DatasourcePlus {
    private readonly config: MSSQLConfig
    static pool: any
    public tables: Record<string, Table> = {}
    public schemaErrors: Record<string, string> = {}

    MASTER_TABLES = [
      "spt_fallback_db",
      "spt_fallback_dev",
      "spt_fallback_usg",
      "spt_monitor",
      "MSreplication_options",
    ]
    TABLES_SQL =
      "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"

    getDefinitionSQL(tableName: string) {
      return `select *
              from INFORMATION_SCHEMA.COLUMNS
              where TABLE_NAME='${tableName}'`
    }

    getConstraintsSQL(tableName: string) {
      return `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS TC 
              INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KU
                ON TC.CONSTRAINT_TYPE = 'PRIMARY KEY' 
                AND TC.CONSTRAINT_NAME = KU.CONSTRAINT_NAME 
                AND KU.table_name='${tableName}'
              ORDER BY 
                KU.TABLE_NAME,
                KU.ORDINAL_POSITION;`
    }

    getAutoColumnsSQL(tableName: string) {
      return `SELECT 
              COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA+'.'+TABLE_NAME),COLUMN_NAME,'IsComputed') 
                AS IS_COMPUTED,
              COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsIdentity')
                AS IS_IDENTITY,
              *
              FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_NAME='${tableName}'`
    }

    constructor(config: MSSQLConfig) {
      super("mssql")
      this.config = config
      const clientCfg = {
        ...this.config,
        options: {
          encrypt: this.config.encrypt,
          enableArithAbort: true,
        },
      }
      delete clientCfg.encrypt
      if (!this.pool) {
        this.pool = new sqlServer.ConnectionPool(clientCfg)
      }
    }

    async connect() {
      try {
        const client = await this.pool.connect()
        this.client = client.request()
      } catch (err) {
        // @ts-ignore
        throw new Error(err)
      }
    }

    /**
     * Fetches the tables from the sql server database and assigns them to the datasource.
     * @param {*} datasourceId - datasourceId to fetch
     * @param entities - the tables that are to be built
     */
    async buildSchema(datasourceId: string, entities: Record<string, Table>) {
      await this.connect()
      let tableNames = await internalQuery(
        this.client,
        getSqlQuery(this.TABLES_SQL)
      )
      if (tableNames == null || !Array.isArray(tableNames.recordset)) {
        throw "Unable to get list of tables in database"
      }
      tableNames = tableNames.recordset
        .map((record: any) => record.TABLE_NAME)
        .filter((name: string) => this.MASTER_TABLES.indexOf(name) === -1)
      const tables: Record<string, Table> = {}
      for (let tableName of tableNames) {
        const definition = await internalQuery(
          this.client,
          getSqlQuery(this.getDefinitionSQL(tableName))
        )
        const constraints = await internalQuery(
          this.client,
          getSqlQuery(this.getConstraintsSQL(tableName))
        )
        const columns = await internalQuery(
          this.client,
          getSqlQuery(this.getAutoColumnsSQL(tableName))
        )
        const autoColumns = columns.recordset
          .filter((col: any) => col.IS_COMPUTED || col.IS_IDENTITY)
          .map((col: any) => col.COLUMN_NAME)
        const primaryKeys = constraints.recordset
          .filter(
            (constraint: any) => constraint.CONSTRAINT_TYPE === "PRIMARY KEY"
          )
          .map((constraint: any) => constraint.COLUMN_NAME)
        let schema: TableSchema = {}
        for (let def of definition.recordset) {
          const name = def.COLUMN_NAME
          if (typeof name !== "string") {
            continue
          }
          const type: string = convertType(def.DATA_TYPE, TYPE_MAP)

          schema[name] = {
            autocolumn: !!autoColumns.find((col: string) => col === name),
            name: name,
            type,
          }
        }
        tables[tableName] = {
          _id: buildExternalTableId(datasourceId, tableName),
          primary: primaryKeys,
          name: tableName,
          schema,
        }
      }
      this.tables = tables
    }

    async read(query: SqlQuery | string) {
      await this.connect()
      const response = await internalQuery(this.client, getSqlQuery(query))
      return response.recordset
    }

    async create(query: SqlQuery | string) {
      await this.connect()
      const response = await internalQuery(this.client, getSqlQuery(query))
      return response.recordset || [{ created: true }]
    }

    async update(query: SqlQuery | string) {
      await this.connect()
      const response = await internalQuery(this.client, getSqlQuery(query))
      return response.recordset || [{ updated: true }]
    }

    async delete(query: SqlQuery | string) {
      await this.connect()
      const response = await internalQuery(this.client, getSqlQuery(query))
      return response.recordset || [{ deleted: true }]
    }

    async query(json: QueryJson) {
      await this.connect()
      const operation = this._operation(json).toLowerCase()
      const input = this._query(json)
      const response = await internalQuery(this.client, input)
      return response.recordset ? response.recordset : [{ [operation]: true }]
    }
  }

  module.exports = {
    schema: SCHEMA,
    integration: SqlServerIntegration,
  }
}
