import { db } from "@budibase/backend-core"
import TestConfiguration from "../../../tests/utilities/TestConfiguration"
import { rawUserMetadata, syncGlobalUsers } from "../utils"

describe("syncGlobalUsers", () => {
  const config = new TestConfiguration()

  beforeEach(async () => {
    await config.init()
  })

  afterAll(config.end)

  it("the default user is synced", async () => {
    await config.doInContext(config.appId, async () => {
      await syncGlobalUsers()

      const metadata = await rawUserMetadata()
      expect(metadata).toHaveLength(1)
      expect(metadata).toEqual([
        expect.objectContaining({
          _id: db.generateUserMetadataID(config.user._id),
        }),
      ])
    })
  })

  it("admin and builders users are synced", async () => {
    const user1 = await config.createUser({ admin: true })
    const user2 = await config.createUser({ admin: false, builder: true })
    await config.doInContext(config.appId, async () => {
      await syncGlobalUsers()

      const metadata = await rawUserMetadata()
      expect(metadata).toHaveLength(3)
      expect(metadata).toContainEqual(
        expect.objectContaining({
          _id: db.generateUserMetadataID(user1._id),
        })
      )
      expect(metadata).toContainEqual(
        expect.objectContaining({
          _id: db.generateUserMetadataID(user2._id),
        })
      )
    })
  })

  it("app users are not synced if not specified", async () => {
    const user = await config.createUser({ admin: false, builder: false })
    await config.doInContext(config.appId, async () => {
      await syncGlobalUsers()

      const metadata = await rawUserMetadata()
      expect(metadata).toHaveLength(1)
      expect(metadata).not.toContainEqual(
        expect.objectContaining({
          _id: db.generateUserMetadataID(user._id),
        })
      )
    })
  })
})
