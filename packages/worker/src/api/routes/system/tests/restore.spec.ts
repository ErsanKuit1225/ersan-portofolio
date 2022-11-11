import { TestConfiguration, API } from "../../../../tests"

describe("/api/system/restore", () => {
  const config = new TestConfiguration()
  const api = new API(config)

  beforeAll(async () => {
    await config.beforeAll()
  })

  afterAll(async () => {
    await config.afterAll()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /api/global/restore", () => {
    it("doesn't allow restore in cloud", async () => {
      const res = await api.restore.restored({ status: 405 })
      expect(res.body).toEqual({
        message: "This operation is not allowed in cloud.",
        status: 405,
      })
    })

    it("restores in self host", async () => {
      config.modeSelf()
      const res = await api.restore.restored()
      expect(res.body).toEqual({
        message: "System prepared after restore.",
      })
      config.modeCloud()
    })
  })
})
