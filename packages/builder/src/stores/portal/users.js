import { writable } from "svelte/store"
import api from "builderStore/api"
import { update } from "lodash"

export function createUsersStore() {
  const { subscribe, set } = writable([])

  async function init() {
    const response = await api.get(`/api/admin/users`)
    const json = await response.json()
    set(json)
  }

  async function invite(email) {
      const response = await api.post(`/api/admin/users/invite`, { email })
      return await response.json()
  }
  async function acceptInvite(inviteCode, password) {
      const response = await api.post("/api/admin/users/invite/accept", { inviteCode, password })
      return await response.json()
  }

  async function create({ email, password }) {
    const response = await api.post("/api/admin/users", { email, password, builder: { global: true}, roles: {} })
    init()
    return await response.json()
  }

  async function del(id) {
    const response = await api.delete(`/api/admin/users/${id}`)
    update(users => (users.filter(user => user._id !== id)))
    return await response.json()
  }

  async function updateRoles(data) {
    console.log(data)
    // const res = await api.post(`/api/admin/users`, data)
    // console.log(await res.json())
    // update(users => (users.filter(user => user._id !== id)))
    // return await response.json()
  }

  return {
    subscribe,
    init,
    invite,
    acceptInvite,
    create,
    updateRoles,
    del
  }
}

export const users = createUsersStore()
