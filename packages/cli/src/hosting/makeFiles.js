const { number } = require("../questions")
const { success } = require("../utils")
const fs = require("fs")
const path = require("path")
const randomString = require("randomstring")
const yaml = require("yaml")

const SINGLE_IMAGE = "budibase/budibase:latest"
const VOL_NAME = "budibase_data"
const COMPOSE_PATH = path.resolve("./docker-compose.yaml")
const ENV_PATH = path.resolve("./.env")

function getSingleCompose(port) {
  const singleComposeObj = {
    version: "3",
    services: {
      budibase: {
        restart: "unless-stopped",
        image: SINGLE_IMAGE,
        ports: [`${port}:80`],
        environment: {
          JWT_SECRET: randomString.generate(),
          MINIO_ACCESS_KEY: randomString.generate(),
          MINIO_SECRET_KEY: randomString.generate(),
          REDIS_PASSWORD: randomString.generate(),
          COUCHDB_USER: "admin",
          COUCH_DB_PASSWORD: randomString.generate(),
          INTERNAL_API_KEY: randomString.generate(),
        },
        volumes: [`${VOL_NAME}:/data`],
      },
    },
    volumes: {
      [VOL_NAME]: {
        driver: "local",
      },
    },
  }
  return yaml.stringify(singleComposeObj)
}

function getEnv(port) {
  return `
# Use the main port in the builder for your self hosting URL, e.g. localhost:10000
MAIN_PORT=${port}

# This section contains all secrets pertaining to the system
JWT_SECRET=${randomString.generate()}
MINIO_ACCESS_KEY=${randomString.generate()}
MINIO_SECRET_KEY=${randomString.generate()}
COUCH_DB_PASSWORD=${randomString.generate()}
COUCH_DB_USER=${randomString.generate()}
REDIS_PASSWORD=${randomString.generate()}
INTERNAL_API_KEY=${randomString.generate()}

# This section contains variables that do not need to be altered under normal circumstances
APP_PORT=4002
WORKER_PORT=4003
MINIO_PORT=4004
COUCH_DB_PORT=4005
REDIS_PORT=6379
WATCHTOWER_PORT=6161
BUDIBASE_ENVIRONMENT=PRODUCTION`
}

module.exports.filePath = ENV_PATH
module.exports.ConfigMap = {
  MAIN_PORT: "port",
}
module.exports.QUICK_CONFIG = {
  key: "budibase",
  port: 10000,
}

async function make(path, contentsFn, inputs = {}) {
  const port =
    inputs.port ||
    (await number(
      "Please enter the port on which you want your installation to run: ",
      10000
    ))
  const fileContents = contentsFn(port)
  fs.writeFileSync(path, fileContents)
  console.log(
    success(
      `Configuration has been written successfully - please check ${path} for more details.`
    )
  )
}

module.exports.makeEnv = async (inputs = {}) => {
  return make(ENV_PATH, getEnv, inputs)
}

module.exports.makeSingleCompose = async (inputs = {}) => {
  return make(COMPOSE_PATH, getSingleCompose, inputs)
}

module.exports.getEnvProperty = property => {
  const props = fs.readFileSync(ENV_PATH, "utf8").split(property)
  if (props[0].charAt(0) === "=") {
    property = props[0]
  } else {
    property = props[1]
  }
  return property.split("=")[1].split("\n")[0]
}
