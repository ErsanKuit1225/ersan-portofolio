import * as setup from "./utilities"
import { FieldType, Table, ViewV2 } from "@budibase/types"
import { generator } from "@budibase/backend-core/tests"
import sdk from "../../../sdk"
import { context } from "@budibase/backend-core"

function priceTable(): Table {
  return {
    name: "table",
    type: "table",
    schema: {
      Price: {
        type: FieldType.NUMBER,
        name: "Price",
        constraints: {},
      },
      Category: {
        type: FieldType.STRING,
        name: "Category",
        constraints: {
          type: "string",
        },
      },
    },
  }
}

describe("/views/v2", () => {
  const request = setup.getRequest()
  const config = setup.getConfig()
  let table: Table

  afterAll(setup.afterAll)

  beforeAll(async () => {
    await config.init()
  })

  beforeEach(async () => {
    table = await config.createTable(priceTable())
  })

  const saveView = async (view: ViewV2) => {
    return request
      .post(`/api/views/v2`)
      .send(view)
      .set(config.defaultHeaders())
      .expect("Content-Type", /json/)
      .expect(200)
  }

  describe("create", () => {
    it("persist the view when the view is successfully created", async () => {
      const view = {
        name: generator.guid(),
        tableId: table._id!,
      }
      const res = await saveView(view)
      expect(res.status).toBe(200)
      expect(res.body._id).toBeDefined()

      await context.doInAppContext(config.appId, async () => {
        const persisted = await sdk.views.get(res.body._id)
        expect(persisted).toEqual({
          _id: res.body._id,
          _rev: res.body._rev,
          ...view,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      })
    })
  })
})
