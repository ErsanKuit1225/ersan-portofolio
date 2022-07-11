import { writable } from "svelte/store"
import { API } from "api"
import { update } from "lodash"

export function createUsersStore() {
  const { subscribe, set } = writable({})

  // opts can contain page and search params
  async function search(opts = {}) {
    const paged = await API.searchUsers(opts)
    set({
      ...paged,
      ...opts,
    })
    return paged
  }

  async function get(userId) {
    try {
      return await API.getUser(userId)
    } catch (err) {
      return null
    }
  }

  async function invite({ emails, builder, admin }) {
    return API.inviteUsers({
      emails,
      builder,
      admin,
    })
  }
  async function acceptInvite(inviteCode, password) {
    return API.acceptInvite({
      inviteCode,
      password,
    })
  }

  async function create(data) {
    let mappedUsers = data.users.map(user => {
      console.log(user)
      const body = {
        email: user.email,
        password: user.password,
        roles: {},
      }
      if (user.forceResetPassword) {
        body.forceResetPassword = user.forceResetPassword
      }

      switch (user.role) {
        case "appUser":
          body.builder = { global: false }
          body.admin = { global: false }
          break
        case "developer":
          body.builder = { global: true }
          break
        case "admin":
          body.admin = { global: true }
          break
      }

      return body
    })
    await API.saveUsers({ users: mappedUsers, groups: data.groups })

    // re-search from first page
    await search()
  }

  async function del(id) {
    await API.deleteUser(id)
    update(users => users.filter(user => user._id !== id))
  }

  async function save(user) {
    return await API.saveUser(user)
  }

  return {
    subscribe,
    search,
    get,
    invite,
    acceptInvite,
    create,
    save,
    delete: del,
  }
}

export const users = createUsersStore()
