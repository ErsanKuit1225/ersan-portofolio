import { Application } from "@budibase/server/api/controllers/public/mapping/types"
import { App } from "@budibase/types"
import { Response } from "node-fetch"
import InternalAPIClient from "./InternalAPIClient"
import FormData from "form-data"

export default class AppApi {
  api: InternalAPIClient

  constructor(apiClient: InternalAPIClient) {
    this.api = apiClient
  }

  async fetch(): Promise<[Response, Application[]]> {
    const response = await this.api.get(`/applications?status=all`)
    const json = await response.json()
    return [response, json]
  }

  async canRender(): Promise<[Response, boolean]> {
    const response = await this.api.get("/routing/client")
    const json = await response.json()
    return [response, Object.keys(json.routes).length > 0]
  }

  async getAppPackage(appId: string): Promise<[Response, any]> {
    const response = await this.api.get(`/applications/${appId}/appPackage`)
    const json = await response.json()
    return [response, json]
  }

  async publish(): Promise<[Response, any]> {
    const response = await this.api.post("/deploy")
    const json = await response.json()
    return [response, json]
  }

  async create(body: any): Promise<[Response, Partial<App>]> {
    const response = await this.api.post(`/applications`, { body })
    const json = await response.json()
    return [response, json]
  }

  async read(id: string): Promise<[Response, Application]> {
    const response = await this.api.get(`/applications/${id}`)
    const json = await response.json()
    return [response, json.data]
  }

  async sync(appId: string): Promise<[Response, any]> {
    const response = await this.api.post(`/applications/${appId}/sync`)
    const json = await response.json()
    return [response, json]
  }

  async updateClient(appId: string, body: any): Promise<[Response, Application]> {
    const response = await this.api.put(`/applications/${appId}/client/update`, { body })
    const json = await response.json()
    return [response, json]
  }

  async revert(appId: string): Promise<[Response, { message: string }]> {
    const response = await this.api.post(`/dev/${appId}/revert`)
    const json = await response.json()
    return [response, json]
  }

  async delete(appId: string): Promise<[Response, any]> {
    const response = await this.api.del(`/applications/${appId}`)
    const json = await response.json()
    return [response, json]
  }

  async getAppDefinition(appId: string): Promise<[Response, any]> {
    const response = await this.api.get(`/applications/${appId}/definition`)
    const json = await response.json()
    return [response, json]
  }

  async update(appId: string, body: any): Promise<[Response, Application]> {
    const response = await this.api.put(`/applications/${appId}`, { body })
    const json = await response.json()
    return [response, json]
  }

  async addScreentoApp(body: any): Promise<[Response, Application]> {
    const response = await this.api.post(`/screens`, { body })
    const json = await response.json()
    return [response, json]
  }

  async getRoutes(): Promise<[Response, any]> {
    const response = await this.api.get(`/routing`)
    const json = await response.json()
    return [response, json]
  }

}
