const postgres = require("./postgres")
const dynamodb = require("./dynamodb")
const mongodb = require("./mongodb")
const elasticsearch = require("./elasticsearch")
const couchdb = require("./couchdb")
// const redis = require("./redis")
const s3 = require("./s3")

const DEFINITIONS = {
  POSTGRES: postgres.schema,
  DYNAMODB: dynamodb.schema,
  MONGODB: mongodb.schema,
  ELASTICSEARCH: elasticsearch.schema,
  COUCHDB: couchdb.schema,
  S3: s3.schema,
}

const INTEGRATIONS = {
  POSTGRES: postgres.integration,
  DYNAMODB: dynamodb.integration,
  MONGODB: mongodb.integration,
  ELASTICSEARCH: elasticsearch.integration,
  COUCHDB: couchdb.integration,
  S3: s3.integration,
}

module.exports = {
  definitions: DEFINITIONS,
  integrations: INTEGRATIONS,
}
