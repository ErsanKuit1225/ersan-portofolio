import { GenericContainer } from "testcontainers"
import mysql from "../../../../packages/server/src/integrations/mysql"

jest.unmock("mysql2/promise")

describe("datasource validators", () => {
  describe("mysql", () => {
    let host: string
    let port: number

    beforeAll(async () => {
      const container = await new GenericContainer("mysql")
        .withExposedPorts(3306)
        .withEnv("MYSQL_ROOT_PASSWORD", "admin")
        .withEnv("MYSQL_DATABASE", "db")
        .withEnv("MYSQL_USER", "user")
        .withEnv("MYSQL_PASSWORD", "password")
        .start()

      host = container.getContainerIpAddress()
      port = container.getMappedPort(3306)
    })

    it("test valid connection string", async () => {
      const integration = new mysql.integration({
        host,
        port,
        user: "user",
        database: "db",
        password: "password",
        rejectUnauthorized: true,
      })
      const result = await integration.testConnection()
      expect(result).toBe(true)
    })

    it("test invalid database", async () => {
      const integration = new mysql.integration({
        host,
        port,
        user: "user",
        database: "test",
        password: "password",
        rejectUnauthorized: true,
      })
      const result = await integration.testConnection()
      expect(result).toEqual({
        error: "Access denied for user 'user'@'%' to database 'test'",
      })
    })

    it("test invalid password", async () => {
      const integration = new mysql.integration({
        host,
        port,
        user: "root",
        database: "test",
        password: "wrong",
        rejectUnauthorized: true,
      })
      const result = await integration.testConnection()
      expect(result).toEqual({
        error:
          "Access denied for user 'root'@'172.17.0.1' (using password: YES)",
      })
    })
  })
})
