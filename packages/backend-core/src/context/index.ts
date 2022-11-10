import env from "../environment"
import { SEPARATOR, DocumentType } from "../db/constants"
import cls from "./FunctionContext"
import { baseGlobalDBName } from "../db/tenancy"
import { IdentityContext } from "@budibase/types"
import { DEFAULT_TENANT_ID as _DEFAULT_TENANT_ID } from "../constants"
import { ContextElement, ContextKey } from "./constants"
import { PouchLike } from "../couch"
import { getDevelopmentAppID, getProdAppID } from "../db/conversions"

type ContextMap = { [key in ContextElement]?: any }

export const DEFAULT_TENANT_ID = _DEFAULT_TENANT_ID

// some test cases call functions directly, need to
// store an app ID to pretend there is a context
let TEST_APP_ID: string | null = null

export function isMultiTenant() {
  return env.MULTI_TENANCY
}

export function isTenantIdSet() {
  const context = cls.getFromContext(ContextKey.MAIN) as ContextMap
  return !!context?.[ContextElement.TENANT_ID]
}

export function isTenancyEnabled() {
  return env.MULTI_TENANCY
}

/**
 * Given an app ID this will attempt to retrieve the tenant ID from it.
 * @return {null|string} The tenant ID found within the app ID.
 */
export function getTenantIDFromAppID(appId: string) {
  if (!appId) {
    return null
  }
  if (!isMultiTenant()) {
    return DEFAULT_TENANT_ID
  }
  const split = appId.split(SEPARATOR)
  const hasDev = split[1] === DocumentType.DEV
  if ((hasDev && split.length === 3) || (!hasDev && split.length === 2)) {
    return null
  }
  if (hasDev) {
    return split[2]
  } else {
    return split[1]
  }
}

function updateContext(updates: ContextMap) {
  let context: ContextMap
  try {
    context = cls.getFromContext(ContextKey.MAIN)
  } catch (err) {
    // no context, start empty
    context = {}
  }
  context = {
    ...context,
    ...updates,
  }
  return context
}

async function newContext(updates: ContextMap, task: any) {
  // see if there already is a context setup
  let context: ContextMap = updateContext(updates)
  return cls.run(async () => {
    cls.setOnContext(ContextKey.MAIN, context)
    return await task()
  })
}

export async function doInContext(appId: string, task: any): Promise<any> {
  const tenantId = getTenantIDFromAppID(appId)
  return newContext(
    {
      [ContextElement.TENANT_ID]: tenantId,
      [ContextElement.APP_ID]: appId,
    },
    task
  )
}

export async function doInTenant(
  tenantId: string | null,
  task: any
): Promise<any> {
  // make sure default always selected in single tenancy
  if (!env.MULTI_TENANCY) {
    tenantId = tenantId || DEFAULT_TENANT_ID
  }

  return newContext(
    {
      [ContextElement.TENANT_ID]: tenantId,
    },
    task
  )
}

export async function doInAppContext(appId: string, task: any): Promise<any> {
  if (!appId) {
    throw new Error("appId is required")
  }

  const tenantId = getTenantIDFromAppID(appId)
  return newContext(
    {
      [ContextElement.TENANT_ID]: tenantId,
      [ContextElement.APP_ID]: appId,
    },
    task
  )
}

export async function doInIdentityContext(
  identity: IdentityContext,
  task: any
): Promise<any> {
  if (!identity) {
    throw new Error("identity is required")
  }

  const context: ContextMap = {
    [ContextElement.IDENTITY]: identity,
  }
  if (identity.tenantId) {
    context[ContextElement.TENANT_ID] = identity.tenantId
  }
  return newContext(context, task)
}

export function getIdentity(): IdentityContext | undefined {
  try {
    const context = cls.getFromContext(ContextKey.MAIN) as ContextMap
    return context?.[ContextElement.IDENTITY]
  } catch (e) {
    // do nothing - identity is not in context
  }
}

export function getTenantId(): string {
  if (!isMultiTenant()) {
    return DEFAULT_TENANT_ID
  }
  const context = cls.getFromContext(ContextKey.MAIN) as ContextMap
  const tenantId = context?.[ContextElement.TENANT_ID]
  if (!tenantId) {
    throw new Error("Tenant id not found")
  }
  return tenantId
}

export function getAppId(): string | undefined {
  const context = cls.getFromContext(ContextKey.MAIN) as ContextMap
  const foundId = context?.[ContextElement.APP_ID]
  if (!foundId && env.isTest() && TEST_APP_ID) {
    return TEST_APP_ID
  } else {
    return foundId
  }
}

export function updateTenantId(tenantId: string | null) {
  let context: ContextMap = updateContext({
    [ContextElement.TENANT_ID]: tenantId,
  })
  cls.setOnContext(ContextKey.MAIN, context)
}

export function updateAppId(appId: string) {
  let context: ContextMap = updateContext({
    [ContextElement.APP_ID]: appId,
  })
  try {
    cls.setOnContext(ContextKey.MAIN, context)
  } catch (err) {
    if (env.isTest()) {
      TEST_APP_ID = appId
    } else {
      throw err
    }
  }
}

export function getGlobalDB(): PouchLike {
  const context = cls.getFromContext(ContextKey.MAIN) as ContextMap
  return new PouchLike(baseGlobalDBName(context?.[ContextElement.TENANT_ID]))
}

/**
 * Gets the app database based on whatever the request
 * contained, dev or prod.
 */
export function getAppDB(opts?: any): PouchLike {
  const appId = getAppId()
  return new PouchLike(appId, opts)
}

/**
 * This specifically gets the prod app ID, if the request
 * contained a development app ID, this will get the prod one.
 */
export function getProdAppDB(opts?: any): PouchLike {
  const appId = getAppId()
  return new PouchLike(getProdAppID(appId), opts)
}

/**
 * This specifically gets the dev app ID, if the request
 * contained a prod app ID, this will get the dev one.
 */
export function getDevAppDB(opts?: any): PouchLike {
  const appId = getAppId()
  return new PouchLike(getDevelopmentAppID(appId), opts)
}
