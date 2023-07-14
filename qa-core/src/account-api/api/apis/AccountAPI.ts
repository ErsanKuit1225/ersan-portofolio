import { Response } from "node-fetch"
import { Account, CreateAccountRequest, SearchAccountsRequest, SearchAccountsResponse } from "@budibase/types"
import AccountInternalAPIClient from "../AccountInternalAPIClient"
import { APIRequestOpts } from "../../../types"

export default class AccountAPI {
  client: AccountInternalAPIClient

  constructor(client: AccountInternalAPIClient) {
    this.client = client
  }

  async validateEmail(
    email: string,
    opts: APIRequestOpts = { doExpect: true }
  ): Promise<Response> {
    const [response, json] = await this.client.post(
      `/api/accounts/validate/email`,
      {
        body: { email },
      }
    )
    if (opts.doExpect) {
      expect(response).toHaveStatusCode(200)
    }
    return response
  }

  async validateTenantId(
    tenantId: string,
    opts: APIRequestOpts = { doExpect: true }
  ): Promise<Response> {
    const [response, json] = await this.client.post(
      `/api/accounts/validate/tenantId`,
      {
        body: { tenantId },
      }
    )
    if (opts.doExpect) {
      expect(response).toHaveStatusCode(200)
    }
    return response
  }

  async create(
    body: CreateAccountRequest,
    opts: APIRequestOpts = { doExpect: true }
  ): Promise<[Response, Account]> {
    const headers = {
      "no-verify": "1",
    }
    const [response, json] = await this.client.post(`/api/accounts`, {
      body,
      headers,
    })
    if (opts.doExpect) {
      expect(response).toHaveStatusCode(201)
    }
    return [response, json]
  }

  async delete(accountID: string) {
    const [response, json] = await this.client.del(
      `/api/accounts/${accountID}`,
      {
        internal: true,
      }
    )
    // can't use expect here due to use in global teardown
    if (response.status !== 204) {
      throw new Error(`Could not delete accountId=${accountID}`)
    }
    return response
  }

  async deleteCurrentAccount() {
    const [response, json] = await this.client.del(
        `/api/accounts`
    )
    return response
  }

  async verifyAccount(
      verificationCode: string,
      opts: APIRequestOpts = { doExpect: true }
  ): Promise<Response> {
    const [response, json] = await this.client.post(
        `/api/accounts/verify`,
        {
          body: { verificationCode },
        }
    )
    if (opts.doExpect) {
      expect(response).toHaveStatusCode(200)
    }
    return response
  }

  async verifyAccountSendEmail(
      email: string,
      opts: APIRequestOpts = { doExpect: true }
  ): Promise<Response> {
    const [response, json] = await this.client.post(
        `/api/accounts/verify/send`,
        {
          body: { email },
        }
    )
    if (opts.doExpect) {
      expect(response).toHaveStatusCode(200)
    }
    return response
  }

  async search(
      searchType: string,
      search: 'email' | 'tenantId',
      opts: APIRequestOpts = { doExpect: true }
  ): Promise<[Response, SearchAccountsResponse]> {
    let body: SearchAccountsRequest = {}

    if (search === 'email') {
      body.email = searchType;
    } else if (search === 'tenantId') {
      body.tenantId = searchType;
    }

    const [response, json] = await this.client.post(
        `/api/accounts/search`,
        {body: body}
    )
    if (opts.doExpect) {
      expect(response).toHaveStatusCode(200)
    }
    return [response, json]
  }
}
