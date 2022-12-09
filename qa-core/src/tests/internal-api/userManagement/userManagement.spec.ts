import TestConfiguration from "../../../config/internal-api/TestConfiguration"
import { Application } from "@budibase/server/api/controllers/public/mapping/types"
import InternalAPIClient from "../../../config/internal-api/TestConfiguration/InternalAPIClient"
import generateApp from "../../../config/internal-api/fixtures/applications"
import { generateUser } from "../../../config/internal-api/fixtures/userManagement"
import { User } from "@budibase/types"

describe("Internal API - User Management & Permissions", () => {
    const api = new InternalAPIClient()
    const config = new TestConfiguration<Application>(api)

    beforeAll(async () => {
        await config.loginAsAdmin()
    })

    afterAll(async () => {
        await config.afterAll()
    })

    it("Add Users with different roles", async () => {
        await config.users.searchUsers()
        await config.users.getRoles()

        // These need to be saved to the context so the passwords can be used to login
        const admin = generateUser(1, "admin")
        expect(admin[0].builder?.global).toEqual(true)
        expect(admin[0].admin?.global).toEqual(true)
        const developer = generateUser(1, "developer")
        expect(developer[0].builder?.global).toEqual(true)
        const appUser = generateUser(1, "appUser")
        expect(appUser[0].builder?.global).toEqual(false)
        expect(appUser[0].admin?.global).toEqual(false)

        await config.users.addMultipleUsers(admin)
        await config.users.addMultipleUsers(developer)
        await config.users.addMultipleUsers(appUser)

        const [allUsersResponse, allUsersJson] = await config.users.getAllUsers()
        expect(allUsersJson.length).toBeGreaterThan(0)



    })

    it("Delete User", async () => {
        const appUser = generateUser()
        expect(appUser[0].builder?.global).toEqual(false)
        expect(appUser[0].admin?.global).toEqual(false)
        const [userResponse, userJson] = await config.users.addMultipleUsers(appUser)
        const userId = userJson.created.successful[0]._id
        await config.users.deleteUser(<string>userId)
    })

    it("Reset Password", async () => {
        const appUser = generateUser()
        expect(appUser[0].builder?.global).toEqual(false)
        expect(appUser[0].admin?.global).toEqual(false)
        const [userResponse, userJson] = await config.users.addMultipleUsers(appUser)
        const [userInfoResponse, userInfoJson] = await config.users.getUserInformation(userJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            password: "newPassword"

        }
        await config.users.forcePasswordReset(body)
    })

    it("Change User information", async () => {
        const appUser = generateUser()
        expect(appUser[0].builder?.global).toEqual(false)
        expect(appUser[0].admin?.global).toEqual(false)
        const [userResponse, userJson] = await config.users.addMultipleUsers(appUser)
        const [userInfoResponse, userInfoJson] = await config.users.getUserInformation(userJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            firstName: "newFirstName",
            lastName: "newLastName",
            builder: {
                global: true
            }
        }
        await config.users.changeUserInformation(body)

        const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getUserInformation(userJson.created.successful[0]._id)
        expect(changedUserInfoJson.builder?.global).toBeDefined()
        expect(changedUserInfoJson.builder?.global).toEqual(true)
    })

    it("Add BASIC user to app", async () => {
        const appUser = generateUser()
        expect(appUser[0].builder?.global).toEqual(false)
        expect(appUser[0].admin?.global).toEqual(false)
        const [createUserResponse, createUserJson] = await config.users.addMultipleUsers(appUser)

        const app = await config.applications.create(generateApp())
        config.applications.api.appId = app.appId

        const [userInfoResponse, userInfoJson] = await config.users.getUserInformation(createUserJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            roles: {
                [app.appId?.toString() || ""]: "BASIC",
            }
        }
        await config.users.changeUserInformation(body)

        const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getUserInformation(createUserJson.created.successful[0]._id)
        expect(changedUserInfoJson.roles[app.appId?.toString() || ""]).toBeDefined()
        expect(changedUserInfoJson.roles[app.appId?.toString() || ""]).toEqual("BASIC")

    })

    it("Add ADMIN user to app", async () => {
        const adminUser = generateUser(1, "admin")
        expect(adminUser[0].builder?.global).toEqual(true)
        expect(adminUser[0].admin?.global).toEqual(true)
        const [createUserResponse, createUserJson] = await config.users.addMultipleUsers(adminUser)

        const app = await config.applications.create(generateApp())
        config.applications.api.appId = app.appId

        const [userInfoResponse, userInfoJson] = await config.users.getUserInformation(createUserJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            roles: {
                [app.appId?.toString() || ""]: "ADMIN",
            }
        }
        await config.users.changeUserInformation(body)

        const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getUserInformation(createUserJson.created.successful[0]._id)
        expect(changedUserInfoJson.roles[app.appId?.toString() || ""]).toBeDefined()
        expect(changedUserInfoJson.roles[app.appId?.toString() || ""]).toEqual("ADMIN")

    })

    it("Add POWER user to app", async () => {
        const powerUser = generateUser(1, 'developer')
        expect(powerUser[0].builder?.global).toEqual(true)

        const [createUserResponse, createUserJson] = await config.users.addMultipleUsers(powerUser)

        const app = await config.applications.create(generateApp())
        config.applications.api.appId = app.appId

        const [userInfoResponse, userInfoJson] = await config.users.getUserInformation(createUserJson.created.successful[0]._id)
        const body: User = {
            ...userInfoJson,
            roles: {
                [app.appId?.toString() || ""]: "POWER",
            }
        }
        await config.users.changeUserInformation(body)

        const [changedUserInfoResponse, changedUserInfoJson] = await config.users.getUserInformation(createUserJson.created.successful[0]._id)
        expect(changedUserInfoJson.roles[<string>app.appId]).toBeDefined()
        expect(changedUserInfoJson.roles[<string>app.appId]).toEqual("POWER")

    })

})
