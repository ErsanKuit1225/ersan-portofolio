import { writable, get } from "svelte/store"
import { API } from "api"
import { auth } from "stores/portal"
import { banner } from "@budibase/bbui"

export function createAdminStore() {
  const DEFAULT_CONFIG = {
    loaded: false,
    multiTenancy: false,
    cloud: false,
    isDev: false,
    disableAccountPortal: false,
    accountPortalUrl: "",
    importComplete: false,
    onboardingProgress: 0,
    checklist: {
      apps: { checked: false },
      smtp: { checked: false },
      adminUser: { checked: false },
      sso: { checked: false },
    },
  }

  const admin = writable(DEFAULT_CONFIG)

  async function init() {
    const tenantId = get(auth).tenantId
    const checklist = await API.getChecklist(tenantId)
    const totalSteps = Object.keys(checklist).length
    const completedSteps = Object.values(checklist).filter(
      x => x?.checked
    ).length
    await getEnvironment()

    // enable system status checks in the cloud
    if (get(admin).cloud) {
      await getSystemStatus()
      checkStatus()
    }

    admin.update(store => {
      store.loaded = true
      store.checklist = checklist
      store.onboardingProgress = (completedSteps / totalSteps) * 100
      return store
    })
  }

  async function checkImportComplete() {
    const result = await API.checkImportComplete()
    admin.update(store => {
      store.importComplete = result ? result.imported : false
      return store
    })
  }

  async function getEnvironment() {
    const environment = await API.getEnvironment()
    admin.update(store => {
      store.multiTenancy = environment.multiTenancy
      store.cloud = environment.cloud
      store.disableAccountPortal = environment.disableAccountPortal
      store.accountPortalUrl = environment.accountPortalUrl
      store.isDev = environment.isDev
      return store
    })
  }

  const checkStatus = async () => {
    const health = get(admin)?.status?.health
    if (!health?.passing) {
      await banner.showStatus()
    }
  }

  async function getSystemStatus() {
    const status = await API.getSystemStatus()
    admin.update(store => {
      store.status = status
      return store
    })
  }

  function unload() {
    admin.update(store => {
      store.loaded = false
      return store
    })
  }

  return {
    subscribe: admin.subscribe,
    init,
    checkImportComplete,
    unload,
  }
}

export const admin = createAdminStore()
