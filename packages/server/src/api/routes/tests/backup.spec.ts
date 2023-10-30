import tk from "timekeeper"
import * as setup from "./utilities"
import { events } from "@budibase/backend-core"
import sdk from "../../../sdk"
import { checkBuilderEndpoint } from "./utilities/TestFunctions"
import { mocks } from "@budibase/backend-core/tests"

mocks.licenses.useBackups()

describe("/backups", () => {
  let request = setup.getRequest()
  let config = setup.getConfig()

  afterAll(setup.afterAll)

  beforeEach(async () => {
    await config.init()
  })

  describe("/api/backups/export", () => {
    it("should be able to export app", async () => {
      const { body, headers } = await config.api.backup.exportBasicBackup(
        config.getAppId()!
      )
      expect(body instanceof Buffer).toBe(true)
      expect(headers["content-type"]).toEqual("application/gzip")
      expect(events.app.exported).toBeCalledTimes(1)
    })

    it("should apply authorization to endpoint", async () => {
      await checkBuilderEndpoint({
        config,
        method: "POST",
        url: `/api/backups/export?appId=${config.getAppId()}`,
      })
    })

    it("should infer the app name from the app", async () => {
      tk.freeze(mocks.date.MOCK_DATE)

      const { headers } = await config.api.backup.exportBasicBackup(
        config.getAppId()!
      )

      expect(headers["content-disposition"]).toEqual(
        `attachment; filename="${
          config.getApp()!.name
        }-export-${mocks.date.MOCK_DATE.getTime()}.tar.gz"`
      )
    })
  })

  describe("/api/backups/import", () => {
    it("should be able to import an app", async () => {
      const appId = config.getAppId()!
      const automation = await config.createAutomation()
      await config.createAutomationLog(automation, appId)
      await config.createScreen()
      const exportRes = await config.api.backup.createBackup(appId)
      expect(exportRes.backupId).toBeDefined()
      const importRes = await config.api.backup.importBackup(
        appId,
        exportRes.backupId
      )
    })
  })

  describe("calculateBackupStats", () => {
    it("should be able to calculate the backup statistics", async () => {
      await config.createAutomation()
      await config.createScreen()
      let res = await sdk.backups.calculateBackupStats(config.getAppId()!)
      expect(res.automations).toEqual(1)
      expect(res.datasources).toEqual(1)
      expect(res.screens).toEqual(1)
    })
  })
})
