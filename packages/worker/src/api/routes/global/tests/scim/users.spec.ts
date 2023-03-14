import tk from "timekeeper"
import { mocks, structures } from "@budibase/backend-core/tests"
import {
  ScimCreateUserRequest,
  ScimUpdateRequest,
  ScimUserResponse,
} from "@budibase/types"
import { TestConfiguration } from "../../../../../tests"

function createScimCreateUserRequest(userData?: {
  externalId?: string
  email?: string
  firstName?: string
  lastName?: string
  username?: string
}) {
  const {
    externalId = structures.uuid(),
    email = structures.generator.email(),
    firstName = structures.generator.first(),
    lastName = structures.generator.last(),
    username = structures.generator.name(),
  } = userData || {}

  const user: ScimCreateUserRequest = {
    schemas: [
      "urn:ietf:params:scim:schemas:core:2.0:User",
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
    ],
    externalId,
    userName: username,
    active: true,
    emails: [
      {
        primary: true,
        type: "work",
        value: email,
      },
    ],
    meta: {
      resourceType: "User",
    },
    name: {
      formatted: structures.generator.name(),
      familyName: lastName,
      givenName: firstName,
    },
    roles: [],
  }
  return user
}

describe("/api/global/scim/v2/users", () => {
  let mockedTime = new Date(structures.generator.timestamp())

  beforeEach(() => {
    tk.reset()
    mockedTime = new Date(structures.generator.timestamp())
    tk.freeze(mockedTime)

    mocks.licenses.useScimIntegration()
  })

  const config = new TestConfiguration()

  beforeAll(async () => {
    await config.beforeAll()
  })

  afterAll(async () => {
    await config.afterAll()
  })

  const featureDisabledResponse = {
    error: {
      code: "feature_disabled",
      featureName: "scimIntegration",
      type: "license_error",
    },
    message: "scimIntegration is not currently enabled",
    status: 400,
  }

  describe("GET /api/global/scim/v2/users", () => {
    const getScimUsers = config.api.scimUsersAPI.get

    it("unauthorised calls are not allowed", async () => {
      const response = await getScimUsers({
        setHeaders: false,
        expect: 403,
      })

      expect(response).toEqual({ message: "Tenant id not set", status: 403 })
    })

    it("cannot be called when feature is disabled", async () => {
      mocks.licenses.useCloudFree()
      const response = await getScimUsers({ expect: 400 })

      expect(response).toEqual(featureDisabledResponse)
    })

    describe("no users exist", () => {
      it("should retrieve empty list", async () => {
        const response = await getScimUsers()

        expect(response).toEqual({
          Resources: [],
          itemsPerPage: 20,
          schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
          startIndex: 1,
          totalResults: 0,
        })
      })
    })

    describe("multiple users exist", () => {
      const userCount = 30
      let users: ScimUserResponse[]

      beforeEach(async () => {
        users = []

        for (let i = 0; i < userCount; i++) {
          const body = createScimCreateUserRequest()
          users.push(await config.api.scimUsersAPI.post({ body }))
        }
      })

      it("fetch full first page", async () => {
        const response = await getScimUsers()

        expect(response).toEqual({
          Resources: expect.arrayContaining(users.splice(0, 20)),
          itemsPerPage: 20,
          schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
          startIndex: 1,
          totalResults: userCount,
        })
      })
    })
  })

  describe("POST /api/global/scim/v2/users", () => {
    const postScimUser = config.api.scimUsersAPI.post

    beforeAll(async () => {
      await config.useNewTenant()
    })

    it("unauthorised calls are not allowed", async () => {
      const response = await postScimUser(
        { body: {} as any },
        {
          setHeaders: false,
          expect: 403,
        }
      )

      expect(response).toEqual({ message: "Tenant id not set", status: 403 })
    })

    it("cannot be called when feature is disabled", async () => {
      mocks.licenses.useCloudFree()
      const response = await postScimUser({ body: {} as any }, { expect: 400 })

      expect(response).toEqual(featureDisabledResponse)
    })

    describe("no users exist", () => {
      it("a new user can be created and persisted", async () => {
        const userData = {
          externalId: structures.uuid(),
          email: structures.generator.email(),
          firstName: structures.generator.first(),
          lastName: structures.generator.last(),
          username: structures.generator.name(),
        }
        const body = createScimCreateUserRequest(userData)

        const response = await postScimUser({ body })

        const expectedScimUser = {
          schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
          id: expect.any(String),
          externalId: userData.externalId,
          meta: {
            resourceType: "User",
            created: mockedTime.toISOString(),
            lastModified: mockedTime.toISOString(),
          },
          userName: userData.username,
          name: {
            formatted: `${userData.firstName} ${userData.lastName}`,
            familyName: userData.lastName,
            givenName: userData.firstName,
          },
          active: true,
          emails: [
            {
              value: userData.email,
              type: "work",
              primary: true,
            },
          ],
        }
        expect(response).toEqual(expectedScimUser)

        const persistedUsers = await config.api.scimUsersAPI.get()
        expect(persistedUsers).toEqual(
          expect.objectContaining({
            totalResults: 1,
            Resources: [expectedScimUser],
          })
        )
      })
    })
  })

  describe("GET /api/global/scim/v2/users/:id", () => {
    let user: ScimUserResponse

    beforeEach(async () => {
      const body = createScimCreateUserRequest()

      user = await config.api.scimUsersAPI.post({ body })
    })

    const findScimUser = config.api.scimUsersAPI.find

    it("unauthorised calls are not allowed", async () => {
      const response = await findScimUser(user.id, {
        setHeaders: false,
        expect: 403,
      })

      expect(response).toEqual({ message: "Tenant id not set", status: 403 })
    })

    it("cannot be called when feature is disabled", async () => {
      mocks.licenses.useCloudFree()
      const response = await findScimUser(user.id, { expect: 400 })

      expect(response).toEqual(featureDisabledResponse)
    })

    it("should return existing user", async () => {
      const response = await findScimUser(user.id)

      expect(response).toEqual(user)
    })

    it("should return 404 when requesting unexisting user id", async () => {
      const response = await findScimUser(structures.uuid(), { expect: 404 })

      expect(response).toEqual({
        message: "missing",
        status: 404,
      })
    })
  })

  describe("PATCH /api/global/scim/v2/users/:id", () => {
    const patchScimUser = config.api.scimUsersAPI.patch

    let user: ScimUserResponse

    beforeEach(async () => {
      const body = createScimCreateUserRequest()

      user = await config.api.scimUsersAPI.post({ body })
    })

    it("unauthorised calls are not allowed", async () => {
      const response = await patchScimUser({} as any, {
        setHeaders: false,
        expect: 403,
      })

      expect(response).toEqual({ message: "Tenant id not set", status: 403 })
    })

    it("cannot be called when feature is disabled", async () => {
      mocks.licenses.useCloudFree()
      const response = await patchScimUser({} as any, { expect: 400 })

      expect(response).toEqual(featureDisabledResponse)
    })

    it("an existing user can be updated", async () => {
      const newUserName = structures.generator.name()
      const newFamilyName = structures.generator.last()
      const body: ScimUpdateRequest = {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        Operations: [
          {
            op: "Replace",
            path: "userName",
            value: newUserName,
          },
          {
            op: "Replace",
            path: "name.familyName",
            value: newFamilyName,
          },
        ],
      }

      const response = await patchScimUser({ id: user.id, body })

      const expectedScimUser: ScimUserResponse = {
        ...user,
        userName: newUserName,
        name: {
          ...user.name,
          familyName: newFamilyName,
          formatted: `${user.name.givenName} ${newFamilyName}`,
        },
      }
      expect(response).toEqual(expectedScimUser)

      const persistedUser = await config.api.scimUsersAPI.find(user.id)
      expect(persistedUser).toEqual(expectedScimUser)
    })
  })

  describe("DELETE /api/global/scim/v2/users/:id", () => {
    const deleteScimUser = config.api.scimUsersAPI.delete

    let user: ScimUserResponse

    beforeEach(async () => {
      const body = createScimCreateUserRequest()

      user = await config.api.scimUsersAPI.post({ body })
    })

    it("unauthorised calls are not allowed", async () => {
      const response = await deleteScimUser(user.id, {
        setHeaders: false,
        expect: 403,
      })

      expect(response).toEqual({ message: "Tenant id not set", status: 403 })
    })

    it("cannot be called when feature is disabled", async () => {
      mocks.licenses.useCloudFree()
      const response = await deleteScimUser(user.id, { expect: 400 })

      expect(response).toEqual(featureDisabledResponse)
    })

    it("an existing user can be deleted", async () => {
      const response = await deleteScimUser(user.id, { expect: 204 })

      expect(response).toEqual({})

      await config.api.scimUsersAPI.find(user.id, { expect: 404 })
    })

    it("an non existing user can not be deleted", async () => {
      await deleteScimUser(structures.uuid(), { expect: 404 })
    })
  })
})
