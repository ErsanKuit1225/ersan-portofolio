import { getTenantId } from "@budibase/backend-core/tenancy"
import { getAllApps } from "@budibase/backend-core/db"
import { getUniqueRows } from "../../../utilities/usageQuota/rows"
import { quotas, QuotaUsageType, StaticQuotaName } from "@budibase/pro"

export const run = async () => {
  // get all rows in all apps
  // @ts-ignore
  const allApps = await getAllApps({ all: true })
  // @ts-ignore
  const appIds = allApps ? allApps.map((app: { appId: any }) => app.appId) : []
  const { appRows } = await getUniqueRows(appIds)
  const counts: { [key: string]: number } = {}
  let rowCount = 0
  Object.entries(appRows).forEach(([appId, rows]) => {
    counts[appId] = rows.length
    rowCount += rows.length
  })

  // sync row count
  const tenantId = getTenantId()
  console.log(`[Tenant: ${tenantId}] Syncing row count: ${rowCount}`)
  await quotas.setUsagePerApp(
    counts,
    StaticQuotaName.ROWS,
    QuotaUsageType.STATIC
  )
}
