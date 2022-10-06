import { writable, get } from "svelte/store"
import { API } from "api"
import { devToolsStore } from "./devTools.js"
import { findComponentPathById } from "../utils/components.js"

const dispatchEvent = (type, data = {}) => {
  window.parent.postMessage({ type, data })
}

const createBuilderStore = () => {
  const initialState = {
    inBuilder: false,
    screen: null,
    selectedComponentId: null,
    editMode: false,
    previewId: null,
    theme: null,
    customTheme: null,
    previewDevice: "desktop",
    isDragging: false,
    navigation: null,
    hiddenComponentIds: [],
    usedPlugins: null,
    dndMode: null,
    dndTarget: null,
    dropTarget: null,

    // Legacy - allow the builder to specify a layout
    layout: null,
  }
  const store = writable(initialState)
  const actions = {
    selectComponent: id => {
      if (id === get(store).selectedComponentId) {
        return
      }
      store.update(state => ({
        ...state,
        editMode: false,
        selectedComponentId: id,
      }))
      devToolsStore.actions.setAllowSelection(false)
      dispatchEvent("select-component", { id })
    },
    updateProp: (prop, value) => {
      dispatchEvent("update-prop", { prop, value })
    },
    keyDown: (key, ctrlKey) => {
      dispatchEvent("key-down", { key, ctrlKey })
    },
    duplicateComponent: id => {
      dispatchEvent("duplicate-component", { id })
    },
    notifyLoaded: () => {
      dispatchEvent("preview-loaded")
    },
    analyticsPing: async () => {
      try {
        await API.analyticsPing({ source: "app" })
      } catch (error) {
        // Do nothing
      }
    },
    moveComponent: (componentId, destinationComponentId, mode) => {
      dispatchEvent("move-component", {
        componentId,
        destinationComponentId,
        mode,
      })
    },
    setDragging: dragging => {
      if (dragging === get(store).isDragging) {
        return
      }
      store.update(state => ({ ...state, isDragging: dragging }))
    },
    setEditMode: enabled => {
      if (enabled === get(store).editMode) {
        return
      }
      store.update(state => ({ ...state, editMode: enabled }))
    },
    clickNav: () => {
      dispatchEvent("click-nav")
    },
    requestAddComponent: () => {
      dispatchEvent("request-add-component")
    },
    highlightSetting: setting => {
      dispatchEvent("highlight-setting", { setting })
    },
    updateUsedPlugin: (name, hash) => {
      // Check if we used this plugin
      const used = get(store)?.usedPlugins?.find(x => x.name === name)
      if (used) {
        store.update(state => {
          state.usedPlugins = state.usedPlugins.filter(x => x.name !== name)
          state.usedPlugins.push({
            ...used,
            hash,
          })
          return state
        })
      }

      // Notify the builder so we can reload component definitions
      dispatchEvent("reload-plugin")
    },
    updateDNDPlaceholder: (mode, target) => {
      console.log(mode, target)
      store.update(state => {
        state.dndMode = mode
        state.dndTarget = target
        return state
      })
    },
    setDropTarget: target => {
      store.update(state => {
        state.dropTarget = target
        return state
      })
    },
  }
  return {
    ...store,
    set: state => store.set({ ...initialState, ...state }),
    actions,
  }
}

export const builderStore = createBuilderStore()
