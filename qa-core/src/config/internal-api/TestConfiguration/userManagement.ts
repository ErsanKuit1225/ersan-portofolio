import { Response } from "node-fetch"
import { Role, User, UserDeletedEvent } from "@budibase/types"
import InternalAPIClient from "./InternalAPIClient"
import { responseMessage } from "../fixtures/types/responseMessage"

export default class UserManagementApi {
    api: InternalAPIClient

    constructor(apiClient: InternalAPIClient) {
        this.api = apiClient
    }

    async searchUsers(): Promise<[Response, Partial<User>[]]> {
        const response = await this.api.post(`/global/users/search`, {})
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.data.length).toBeGreaterThan(0)
        return [response, json]
    }

    async getSelf(): Promise<[Response, Partial<User>]> {
        const response = await this.api.get(`/global/self`)
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        return [response, json]
    }

    async getAllUsers(): Promise<[Response, Partial<User>[]]> {
        const response = await this.api.get(`/global/users`)
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.length).toBeGreaterThan(0)
        return [response, json]
    }

    async addMultipleUsers(userList: Partial<User>[]): Promise<[Response, any]> {
        const body = {
            create: {
                users: userList,
                groups: []
            }
        }
        const response = await this.api.post(`/global/users/bulk`, { body })
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.created.unsuccessful.length).toEqual(0)
        expect(json.created.successful.length).toEqual(body.create.users.length)
        return [response, json]
    }

    async deleteMultipleUsers(userId: string[]): Promise<[Response, responseMessage]> {
        const body = {
            delete: {
                userIds: [
                    userId
                ]
            }
        }
        const response = await this.api.post(`/global/users/bulk`, { body })
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.deleted.successful.length).toEqual(1)
        expect(json.deleted.unsuccessful.length).toEqual(0)
        expect(json.deleted.successful[0].userId).toEqual(userId)
        return [response, json]
    }
    async deleteUser(userId: string): Promise<[Response, UserDeletedEvent]> {
        const response = await this.api.del(`/global/users/${userId}`)
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.message).toEqual(`User ${userId} deleted.`)
        return [response, json]
    }

    async inviteUser(body: any): Promise<[Response, responseMessage]> {
        const response = await this.api.post(`/global/users/multi/invite`, { body })
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.unsuccessful.length).toEqual(0)
        expect(json.successful.length).toEqual(body.length)

        return [response, json]
    }

    async getRoles(): Promise<[Response, Role[]]> {
        const response = await this.api.get(`/roles`)
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.length).toEqual(4)
        return [response, json]
    }

    async changeUserInformation(body: any): Promise<[Response, User]> {
        const response = await this.api.post(`/global/users/`, { body })
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json._id).toEqual(body._id)
        expect(json._rev).not.toEqual(body._rev)
        return [response, json]
    }

    async forcePasswordReset(body: any): Promise<[Response, User]> {
        const response = await this.api.post(`/global/users/`, { body })
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json._id).toEqual(body._id)
        expect(json._rev).not.toEqual(body._rev)
        return [response, json]
    }

    async getUserInformation(userId: string): Promise<[Response, User]> {
        const response = await this.api.get(`/global/users/${userId}`)
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        return [response, json]
    }
} 