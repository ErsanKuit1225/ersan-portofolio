import { context, locks, queue } from "@budibase/backend-core"
import { LockName, LockType } from "@budibase/types"
import { Job } from "bull"
import { MIGRATIONS } from "./migrations"
import {
  getAppMigrationMetadata,
  updateAppMigrationMetadata,
} from "./appMigrationMetadata"
import environment from "../environment"

const appMigrationQueue = queue.createQueue(queue.JobQueue.APP_MIGRATION)
appMigrationQueue.process(processMessage)

// TODO
export const PROCESS_MIGRATION_TIMEOUT =
  environment.APP_MIGRATION_TIMEOUT || 60000

async function processMessage(job: Job) {
  const { appId } = job.data
  console.log(`Processing app migration for "${appId}"`)

  await locks.doWithLock(
    {
      name: LockName.APP_MIGRATION,
      type: LockType.DEFAULT,
      resource: appId,
      ttl: PROCESS_MIGRATION_TIMEOUT,
    },
    async () => {
      await context.doInAppContext(appId, async () => {
        const currentVersion = await getAppMigrationMetadata(appId)

        const pendingMigrations = MIGRATIONS.filter(
          m => m.migrationId > currentVersion
        )

        let index = 0
        for (const migration of pendingMigrations) {
          const counter = `(${++index}/${pendingMigrations.length})`
          console.info(`Running migration ${migration}... ${counter}`, {
            migration,
            appId,
          })
          await migration.migrationFunc()
          await updateAppMigrationMetadata({
            appId,
            version: migration.migrationId,
          })
        }
      })
    }
  )

  console.log(`App migration for "${appId}" processed`)
}

export default appMigrationQueue
