import { writable, derived } from "svelte/store"
import { generate } from "shortid"


let NOTIFICATION_TIMEOUT = 3000

const createNotificationStore = () => {
  const _notifications = writable([])
  
	const send = (message, type = "default") => {
    _notifications.update(state => {
      return [
        ...state,
        { id: generate(), type, message },
      ]
    })
  }
  
  const notifications = derived(_notifications, ($_notifications, set) => {
    set($_notifications)
    if ($_notifications.length > 0) {
      const timeout = setTimeout(() => {
        _notifications.update(state => {
          state.shift()
          return state
        })
        set($_notifications)
      }, NOTIFICATION_TIMEOUT)
      return () => {
        clearTimeout(timeout);
      };
    }
	})
  const { subscribe } = notifications

  return {
    subscribe,
		send,
    danger: msg => send(msg, "danger"),
  	warning: msg => send(msg, "warning"),
  	info: msg => send(msg, "info"),
  	success: msg => send(msg, "success"),
  }
}

export const notificationStore = createNotificationStore()

// setTimeout(() => {
//   notificationStore.update(state => {
//     state.notifications.shift()
//     state.notifications = state.notifications
//     return state
//   })
// }, timeout)