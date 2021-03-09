const setup = require("./utilities")
const { checkBuilderEndpoint } = require("./utilities/TestFunctions")
const { budibaseAppsDir } = require("../../../utilities/budibaseDir")
const fs = require("fs")
const path = require("path")

describe("/api/keys", () => {
  let request = setup.getRequest()
  let config = setup.getConfig()

  afterAll(setup.afterAll)

  beforeEach(async () => {
    await config.init()
  })

  describe("fetch", () => {
    it("should allow fetching", async () => {
      const res = await request
        .get(`/api/keys`)
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body).toBeDefined()
    })

    it("should check authorization for builder", async () => {
      await checkBuilderEndpoint({
        config,
        method: "GET",
        url: `/api/keys`,
      })
    })
  })

  describe("update", () => {
    it("should allow updating a value", async () => {
      fs.writeFileSync(path.join(budibaseAppsDir(), ".env"), "")
      const res = await request
        .put(`/api/keys/TEST`)
        .send({
          value: "test"
        })
        .set(config.defaultHeaders())
        .expect("Content-Type", /json/)
        .expect(200)
      expect(res.body["TEST"]).toEqual("test")
      expect(process.env.TEST_API_KEY).toEqual("test")
    })

    it("should check authorization for builder", async () => {
      await checkBuilderEndpoint({
        config,
        method: "PUT",
        url: `/api/keys/TEST`,
      })
    })
  })
})