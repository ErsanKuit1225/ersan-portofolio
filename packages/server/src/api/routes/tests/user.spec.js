const {
  createApplication,
  supertest,
  defaultHeaders,
  createUser,
  testPermissionsForEndpoint,
} = require("./couchTestUtils")
const {
  BUILTIN_PERMISSION_NAMES,
} = require("../../../utilities/security/permissions")
const {
  BUILTIN_LEVELS
} = require("../../../utilities/security/accessLevels")

describe("/users", () => {
  let request
  let server
  let app
  let appId

  beforeAll(async () => {
    ({ request, server } = await supertest(server))
  });

  beforeEach(async () => {
    app = await createApplication(request)
    appId = app.instance._id
  });

  afterAll(() => {
    server.close()
    server.destroy()
  })

  describe("fetch", () => {
    it("returns a list of users from an instance db", async () => {
      await createUser(request, appId, "brenda", "brendas_password")
      await createUser(request, appId, "pam", "pam_password")
      const res = await request
        .get(`/api/users`)
        .set(defaultHeaders(appId))
        .expect('Content-Type', /json/)
        .expect(200)
      
      expect(res.body.length).toBe(2)
      expect(res.body.find(u => u.username === "brenda")).toBeDefined()
      expect(res.body.find(u => u.username === "pam")).toBeDefined()
    })

    it("should apply authorization to endpoint", async () => {
      await createUser(request, appId, "brenda", "brendas_password")
      await testPermissionsForEndpoint({
        request,
        method: "GET",
        url: `/api/users`,
        appId: appId,
        permName1: BUILTIN_PERMISSION_NAMES.POWER,
        permName2: BUILTIN_PERMISSION_NAMES.WRITE,
      })
    })

  })

  describe("create", () => {

    it("returns a success message when a user is successfully created", async () => {
      const res = await request
        .post(`/api/users`)
        .set(defaultHeaders(appId))
        .send({ name: "Bill", username: "bill", password: "bills_password", accessLevelId: BUILTIN_LEVELS.power._id })
        .expect(200)
        .expect('Content-Type', /json/)

      expect(res.res.statusMessage).toEqual("User created successfully."); 
      expect(res.body._id).toBeUndefined()
    })

    it("should apply authorization to endpoint", async () => {
      await testPermissionsForEndpoint({
        request,
        method: "POST",
        body: { name: "brandNewUser", username: "brandNewUser", password: "yeeooo", accessLevelId: BUILTIN_LEVELS.power._id },
        url: `/api/users`,
        appId: appId,
        permName1: BUILTIN_PERMISSION_NAMES.ADMIN,
        permName2: BUILTIN_PERMISSION_NAMES.POWER,
      })
    })

  });
})
