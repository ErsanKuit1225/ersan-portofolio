const userResource = require("./user")
const { object } = require("./utils")
const Resource = require("./utils/Resource")

const application = {
  _id: "app_metadata",
  appId: "app_dev_957b12f943d348faa61db7e18e088d0f",
  version: "1.0.58-alpha.0",
  name: "App name",
  url: "/app-url",
  tenantId: "default",
  updatedAt: "2022-02-22T13:00:54.035Z",
  createdAt: "2022-02-11T18:02:26.961Z",
  status: "development",
  lockedBy: userResource.getExamples().user.value.user,
}

const base = {
  name: {
    description: "The name of the app.",
    type: "string",
  },
  url: {
    description:
      "The URL by which the app is accessed, this must be URL encoded.",
    type: "string",
  },
}

const applicationSchema = object(base, { required: ["name", "url"] })

const applicationSchemaOutput = object(
  {
    ...base,
    status: {
      description:
        "The status of the app, stating it if is the development or published version.",
      type: "string",
      enum: ["development", "published"],
    },
    createdAt: {
      description:
        "States when the app was created, will be constant. Stored in ISO format.",
      type: "string",
    },
    updatedAt: {
      description:
        "States the last time the app was updated - stored in ISO format.",
      type: "string",
    },
    version: {
      description:
        "States the version of the Budibase client this app is currently based on.",
      type: "string",
    },
    tenantId: {
      description:
        "In a multi-tenant environment this will state the tenant this app is within.",
      type: "string",
    },
    lockedBy: {
      description: "The user this app is currently being built by.",
      type: "object",
    },
    appId: {
      description: "The ID of the app.",
      type: "string",
    },
  },
  {
    required: [
      "name",
      "url",
      "status",
      "createdAt",
      "updatedAt",
      "version",
      "appId",
    ],
  }
)

module.exports = new Resource()
  .setExamples({
    application: {
      value: {
        application: application,
      },
    },
    applications: {
      value: {
        applications: [application],
      },
    },
  })
  .setSchemas({
    application: applicationSchema,
    applicationOutput: object({
      application: applicationSchemaOutput,
    }),
  })
