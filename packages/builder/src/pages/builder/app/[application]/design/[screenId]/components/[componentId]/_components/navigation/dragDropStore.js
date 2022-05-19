import { writable, get } from "svelte/store"
import { store as frontendStore } from "builderStore"
import { findComponentPath } from "builderStore/componentUtils"

export const DropEffect = {
  MOVE: "move",
  COPY: "copy",
}

export const DropPosition = {
  ABOVE: "above",
  BELOW: "below",
  INSIDE: "inside",
}

export default function () {
  const store = writable({})

  store.actions = {
    dragstart: component => {
      store.update(state => {
        state.dragged = component
        return state
      })
    },
    dragover: ({ component, canHaveChildren, mousePosition }) => {
      store.update(state => {
        state.targetComponent = component
        // only allow dropping inside when container is empty
        // if container has children, drag over them

        if (canHaveChildren) {
          if (mousePosition <= 0.33) {
            // hovered above center of target
            state.dropPosition = DropPosition.ABOVE
          } else if (mousePosition >= 0.66) {
            // hovered around bottom of target
            state.dropPosition = DropPosition.BELOW
          } else {
            // hovered in center of target
            state.dropPosition = DropPosition.INSIDE
          }
          return state
        }

        // bottom half
        state.dropPosition =
          mousePosition > 0.5 ? DropPosition.BELOW : DropPosition.ABOVE
        return state
      })
    },
    reset: () => {
      store.update(state => {
        state.dropPosition = ""
        state.targetComponent = null
        state.dragged = null
        return state
      })
    },
    drop: async () => {
      const state = get(store)

      // Stop if the target and source are the same
      if (state.targetComponent === state.dragged) {
        return
      }
      // Stop if the target or source are null
      if (!state.targetComponent || !state.dragged) {
        return
      }
      // Stop if the target is a child of source
      const path = findComponentPath(state.dragged, state.targetComponent._id)
      const ids = path.map(component => component._id)
      if (ids.includes(state.targetComponent._id)) {
        return
      }

      // Cut and paste the component
      frontendStore.actions.components.copy(state.dragged, true)
      await frontendStore.actions.components.paste(
        state.targetComponent,
        state.dropPosition
      )
      store.actions.reset()
    },
  }

  return store
}
