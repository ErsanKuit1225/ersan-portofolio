import { writable } from "svelte/store"
import { cloneDeep } from "lodash/fp"
import { uuid } from "builderStore/uuid"
import api from "../api"

export const getBackendUiStore = () => {
  const INITIAL_BACKEND_UI_STATE = {
    models: [],
    views: [],
    users: [],
    selectedDatabase: {},
    selectedModel: {},
    draftModel: {},
    tabs: {
      SETUP_PANEL: "SETUP",
      NAVIGATION_PANEL: "NAVIGATE",
    },
  }

  const store = writable(INITIAL_BACKEND_UI_STATE)

  store.actions = {
    database: {
      select: async db => {
        const modelsResponse = await api.get(`/api/models`)
        const viewsResponse = await api.get(`/api/views`)
        const models = await modelsResponse.json()
        const views = await viewsResponse.json()
        store.update(state => {
          state.selectedDatabase = db
          if (models && models.length > 0) {
            store.actions.models.select(models[0])
          }
          state.models = models
          state.views = views
          return state
        })
      },
    },
    records: {
      delete: () =>
        store.update(state => {
          state.selectedView = state.selectedView
          return state
        }),
      select: record =>
        store.update(state => {
          state.selectedRecord = record
          return state
        }),
    },
    models: {
      fetch: async () => {
        const modelsResponse = await api.get(`/api/models`)
        const models = await modelsResponse.json()
        store.update(state => {
          state.models = models
          return state
        })
      },
      select: model =>
        store.update(state => {
          state.selectedModel = model
          state.draftModel = cloneDeep(model)
          state.selectedField = ""
          state.selectedView = `all_${model._id}`
          state.tabs.SETUP_PANEL = "SETUP"
          return state
        }),
      save: async ({ model }) => {
        const updatedModel = cloneDeep(model)

        const SAVE_MODEL_URL = `/api/models`
        await api.post(SAVE_MODEL_URL, updatedModel)
        await store.actions.models.fetch()
      },
      addField: field => {
        store.update(state => {
          if (!state.draftModel.schema) {
            state.draftModel.schema = {}
          }

          state.draftModel.schema = {
            ...state.draftModel.schema,
            [field.name]: field,
          }
          state.selectedField = field.name
          state.tabs.NAVIGATION_PANEL = "NAVIGATE"

          return state
        })
      },
    },
    views: {
      select: view =>
        store.update(state => {
          state.selectedView = view
          return state
        }),
    },
    users: {
      create: user =>
        store.update(state => {
          state.users.push(user)
          state.users = state.users
          return state
        }),
    },
  }

  return store
}

// Store Actions
export const createDatabaseForApp = store => appInstance => {
  store.update(state => {
    state.appInstances.push(appInstance)
    return state
  })
}
