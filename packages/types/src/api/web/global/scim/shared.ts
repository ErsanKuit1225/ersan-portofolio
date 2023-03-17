export interface ScimListResponse<T> {
  schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"]
  totalResults: number
  Resources: T[]
  startIndex: number
  itemsPerPage: number
}
