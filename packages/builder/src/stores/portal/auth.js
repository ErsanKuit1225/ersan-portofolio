import { derived, writable, get } from "svelte/store"
import api from "../../builderStore/api"

export function createAuthStore() {
  const auth = writable({
    user: null,
    tenantId: "default",
    tenantSet: false,
  })
  const store = derived(auth, $store => {
    let initials = null
    let isAdmin = false
    let isBuilder = false
    if ($store.user) {
      const user = $store.user
      if (user.firstName) {
        initials = user.firstName[0]
        if (user.lastName) {
          initials += user.lastName[0]
        }
      } else if (user.email) {
        initials = user.email[0]
      } else {
        initials = "Unknown"
      }
      isAdmin = !!user.admin?.global
      isBuilder = !!user.builder?.global
    }
    return {
      user: $store.user,
      tenantId: $store.tenantId,
      tenantSet: $store.tenantSet,
      initials,
      isAdmin,
      isBuilder,
    }
  })

  function setUser(user) {
    auth.update(store => {
      store.user = user
      if (user) {
        store.tenantId = user.tenantId || "default"
        store.tenantSet = true
      }
      return store
    })
  }

  function setOrganisation(tenantId) {
    auth.update(store => {
      store.tenantId = tenantId
      store.tenantSet = !!tenantId
      return store
    })
  }

  return {
    subscribe: store.subscribe,
    checkQueryString: () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has("tenantId")) {
        const tenantId = urlParams.get("tenantId")
        setOrganisation(tenantId)
      }
    },
    setOrg: tenantId => {
      setOrganisation(tenantId)
    },
    checkAuth: async () => {
      const response = await api.get("/api/global/users/self")
      if (response.status !== 200) {
        setUser(null)
      } else {
        const json = await response.json()
        setUser(json)
      }
    },
    login: async creds => {
      const tenantId = get(store).tenantId
      const response = await api.post(
        `/api/global/auth/${tenantId}/login`,
        creds
      )
      const json = await response.json()
      if (response.status === 200) {
        setUser(json.user)
      } else {
        throw "Invalid credentials"
      }
      return json
    },
    logout: async () => {
      const response = await api.post(`/api/global/auth/logout`)
      if (response.status !== 200) {
        throw "Unable to create logout"
      }
      await response.json()
      setUser(null)
    },
    updateSelf: async fields => {
      const newUser = { ...get(auth).user, ...fields }
      const response = await api.post("/api/global/users/self", newUser)
      if (response.status === 200) {
        setUser(newUser)
      } else {
        throw "Unable to update user details"
      }
    },
    forgotPassword: async email => {
      const tenantId = get(store).tenantId
      const response = await api.post(`/api/global/auth/${tenantId}/reset`, {
        email,
      })
      if (response.status !== 200) {
        throw "Unable to send email with reset link"
      }
      await response.json()
    },
    resetPassword: async (password, code) => {
      const tenantId = get(store).tenantId
      const response = await api.post(
        `/api/global/auth/${tenantId}/reset/update`,
        {
          password,
          resetCode: code,
        }
      )
      if (response.status !== 200) {
        throw "Unable to reset password"
      }
      await response.json()
    },
    createUser: async user => {
      const response = await api.post(`/api/global/users`, user)
      if (response.status !== 200) {
        throw "Unable to create user"
      }
      await response.json()
    },
  }
}

export const auth = createAuthStore()
