import { Datasource } from "../../../documents"

export interface CreateDatasourceResponse {
  datasource: Datasource
  error?: any
}

export interface UpdateDatasourceResponse {
  datasource: Datasource
}

export interface CreateDatasourceRequest {
  datasource: Datasource
  fetchSchema?: boolean
}

export interface VerifyDatasourceRequest {
  datasource: Datasource
}

export interface VerifyDatasourceResponse {
  connected: boolean
}

export interface UpdateDatasourceRequest extends Datasource {
  datasource: Datasource
}
