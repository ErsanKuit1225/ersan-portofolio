import {
  DatasourceFieldTypes,
  Integration,
  QueryTypes,
} from "../definitions/datasource"
import Redis from "ioredis"

module RedisModule {
  interface RedisConfig {
    host: string
    port: number
    username: string
    password?: string
  }

  const SCHEMA: Integration = {
    docs: "https://redis.io/docs/",
    description: "",
    friendlyName: "Redis",
    datasource: {
      host: {
        type: "string",
        required: true,
        default: "localhost",
      },
      port: {
        type: "number",
        required: true,
        default: 6379,
      },
      username: {
        type: "string",
        required: false,
      },
      password: {
        type: "password",
        required: false,
      },
    },
    query: {
      create: {
        type: QueryTypes.FIELDS,
        fields: {
          key: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
          value: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
        },
      },
      read: {
        readable: true,
        type: QueryTypes.FIELDS,
        fields: {
          key: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
        },
      },
      delete: {
        type: QueryTypes.FIELDS,
        fields: {
          key: {
            type: DatasourceFieldTypes.STRING,
            required: true,
          },
        },
      },
      command: {
        readable: true,
        displayName: "Redis Command",
        type: QueryTypes.JSON,
      },
    },
  }

  class RedisIntegration {
    private readonly config: RedisConfig
    private client: any

    constructor(config: RedisConfig) {
      this.config = config
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
      })
    }

    async disconnect() {
      this.client.disconnect()
    }

    async redisContext(query: Function) {
      try {
        return await query()
      } catch (err) {
        throw new Error(`Redis error: ${err}`)
      } finally {
        this.disconnect()
      }
    }

    async create(query: { key: string; value: string }) {
      return this.redisContext(async () => {
        const response = await this.client.set(query.key, query.value)
        return response
      })
    }

    async read(query: { key: string }) {
      return this.redisContext(async () => {
        const response = await this.client.get(query.key)
        return response
      })
    }

    async delete(query: { key: string }) {
      return this.redisContext(async () => {
        const response = await this.client.del(query.key)
        return response
      })
    }

    async command(query: { json: string }) {
      return this.redisContext(async () => {
        const commands = query.json.trim().split(" ")
        const pipeline = this.client.pipeline([commands])
        const result = await pipeline.exec()
        return {
          response: result[0][1],
        }
      })
    }
  }

  module.exports = {
    schema: SCHEMA,
    integration: RedisIntegration,
  }
}
