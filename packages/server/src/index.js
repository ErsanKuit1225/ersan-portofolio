const { resolve, join } = require("path")
const { homedir } = require("os")
const { app } = require("electron")
const fixPath = require("fix-path")

async function runServer() {
  const homeDir = app ? app.getPath("home") : homedir()

  const budibaseDir = join(homeDir, ".budibase")
  process.env.BUDIBASE_DIR = budibaseDir

  fixPath()

  require("dotenv").config({ path: resolve(budibaseDir, ".env") })

  const server = await require("./app")()

  server.on("close", () => console.log("Server Closed"))
  console.log(`Budibase running on ${JSON.stringify(server.address())}`)
}

runServer()

process.on("SIGINT", function() {
  console.log("\nGracefully shutting down from SIGINT")
  process.exit(1)
})
