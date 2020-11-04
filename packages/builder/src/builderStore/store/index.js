import { cloneDeep } from "lodash/fp"
import getNewComponentName from "../getNewComponentName"
import { backendUiStore } from "builderStore"
import { writable, get } from "svelte/store"
import api from "../api"
import { DEFAULT_PAGES_OBJECT } from "../../constants"
import { getExactComponent } from "components/userInterface/pagesParsing/searchComponents"
import {
  createProps,
  makePropsSafe,
  getBuiltin,
} from "components/userInterface/pagesParsing/createProps"
import { fetchComponentLibDefinitions } from "../loadComponentLibraries"
import { generate_screen_css } from "../generate_css"
import analytics from "analytics"
import { uuid } from "../uuid"
import {
  selectComponent as _selectComponent,
  getParent,
  walkProps,
  savePage as _savePage,
  saveCurrentPreviewItem as _saveCurrentPreviewItem,
  // saveScreenApi as _saveScreenApi,
  regenerateCssForCurrentScreen,
  regenerateCssForScreen,
  generateNewIdsForComponent,
  getComponentDefinition,
  findChildComponentType,
} from "../storeUtils"

export const getStore = () => {
  const initial = {
    apps: [],
    name: "",
    description: "",
    pages: DEFAULT_PAGES_OBJECT,
    mainUi: {},
    unauthenticatedUi: {},
    components: [],
    currentPreviewItem: null,
    currentComponentInfo: null,
    currentFrontEndType: "none",
    currentPageName: "",
    currentComponentProps: null,
    errors: [],
    hasAppPackage: false,
    libraries: null,
    appId: "",
  }

  const store = writable(initial)

  store.setPackage = setPackage(store, initial)

  store.saveScreen = saveScreen(store)
  store.setCurrentScreen = setCurrentScreen(store)
  store.deleteScreens = deleteScreens(store)
  store.setCurrentPage = setCurrentPage(store)
  store.createLink = createLink(store)
  store.createScreen = createScreen(store)
  // store.savePage = savePage(store)
  store.addChildComponent = addChildComponent(store)
  store.selectComponent = selectComponent(store)
  store.setComponentProp = setComponentProp(store)
  store.setPageOrScreenProp = setPageOrScreenProp(store)
  store.setComponentStyle = setComponentStyle(store)
  store.setScreenType = setScreenType(store)
  store.getPathToComponent = getPathToComponent(store)
  store.pasteComponent = pasteComponent(store)
  store.storeComponentForCopy = storeComponentForCopy(store)
  return store
}

export default getStore

const setPackage = (store, initial) => async pkg => {
  const screens = await api.get("/api/screens").then(r => r.json())

  const mainScreens = screens.filter(screen =>
      screen._id.includes(pkg.pages.main._id)
    ),
    unauthScreens = screens.filter(screen =>
      screen._id.includes(pkg.pages.unauthenticated._id)
    )
  pkg.pages = {
    main: {
      ...pkg.pages.main,
      _screens: mainScreens,
    },
    unauthenticated: {
      ...pkg.pages.unauthenticated,
      _screens: unauthScreens,
    },
  }

  // if the app has just been created
  // we need to build the CSS and save
  if (pkg.justCreated) {
    const generateInitialPageCss = async name => {
      const page = pkg.pages[name]
      regenerateCssForScreen(page)
      for (let screen of page._screens) {
        regenerateCssForScreen(screen)
      }

      await api.post(`/api/pages/${page._id}`, {
        page: {
          componentLibraries: pkg.application.componentLibraries,
          ...page,
        },
        screens: page._screens,
      })
    }
    await generateInitialPageCss("main")
    await generateInitialPageCss("unauthenticated")
    pkg.justCreated = false
  }

  initial.libraries = pkg.application.componentLibraries
  initial.components = await fetchComponentLibDefinitions(pkg.application._id)
  initial.name = pkg.application.name
  initial.description = pkg.application.description
  initial.appId = pkg.application._id
  initial.pages = pkg.pages
  initial.hasAppPackage = true
  initial.screens = [
    ...Object.values(mainScreens),
    ...Object.values(unauthScreens),
  ]
  initial.builtins = [getBuiltin("##builtin/screenslot")]
  initial.appInstance = pkg.application.instance
  initial.appId = pkg.application._id
  store.set(initial)
  await backendUiStore.actions.database.select(initial.appInstance)
  return initial
}

const saveScreen = store => async screen => {
  const storeContents = get(store)
  const pageName = storeContents.currentPageName || "main"
  const currentPage = storeContents.pages[pageName]
  const currentPageScreens = currentPage._screens

  let savePromise
  const response = await api.post(`/api/screens/${currentPage._id}`, screen)
  const json = await response.json()

  if (currentPageScreens.includes(screen)) return

  screen._rev = json.rev
  screen._id = json.id

  const screens = [...currentPageScreens, screen]

  // TODO: should carry out all server updates to screen in a single call
  store.update(state => {
    state.pages[pageName]._screens = screens
    state.screens = screens
    state.currentPreviewItem = screen
    const safeProps = makePropsSafe(
      state.components[screen.props._component],
      screen.props
    )
    state.currentComponentInfo = safeProps
    screen.props = safeProps
    savePromise = _savePage(state)
    return state
  })
  await savePromise
}

const createScreen = store => async screen => {
  let savePromise
  store.update(state => {
    state.currentPreviewItem = screen
    state.currentComponentInfo = screen.props
    state.currentFrontEndType = "screen"
    regenerateCssForCurrentScreen(state)
    savePromise = saveScreen(store)(screen)
    return state
  })
  await savePromise
}

const createLink = store => async (url, title) => {
  let savePromise
  store.update(state => {
    // Try to extract a nav component from the master screen
    const nav = findChildComponentType(
      state.pages.main,
      "@budibase/standard-components/Navigation"
    )
    if (nav) {
      let newLink

      // Clone an existing link if one exists
      if (nav._children && nav._children.length) {
        // Clone existing link style
        newLink = cloneDeep(nav._children[0])

        // Manipulate IDs to ensure uniqueness
        generateNewIdsForComponent(newLink, state, false)

        // Set our new props
        newLink._instanceName = `${title} Link`
        newLink.url = url
        newLink.text = title
      } else {
        // Otherwise create vanilla new link
        const component = getComponentDefinition(
          state,
          "@budibase/standard-components/link"
        )
        const instanceId = get(backendUiStore).selectedDatabase._id
        newLink = createProps(component, {
          url,
          text: title,
          _instanceName: `${title} Link`,
          _instanceId: instanceId,
        }).props
      }

      // Save page and regenerate all CSS because otherwise weird things happen
      nav._children = [...nav._children, newLink]
      state.currentPageName = "main"
      regenerateCssForScreen(state.pages.main)
      for (let screen of state.pages.main._screens) {
        regenerateCssForScreen(screen)
      }
      savePromise = _savePage(state)
    }
    return state
  })
  await savePromise
}

const setCurrentScreen = store => screenName => {
  store.update(s => {
    const screen = getExactComponent(s.screens, screenName, true)
    s.currentPreviewItem = screen
    s.currentFrontEndType = "screen"
    s.currentView = "detail"
    regenerateCssForCurrentScreen(s)
    const safeProps = makePropsSafe(
      s.components[screen.props._component],
      screen.props
    )
    screen.props = safeProps
    s.currentComponentInfo = safeProps
    return s
  })
}

const deleteScreens = store => (screens, pageName = null) => {
  if (!(screens instanceof Array)) {
    screens = [screens]
  }
  store.update(state => {
    if (pageName == null) {
      pageName = state.pages.main.name
    }
    for (let screen of screens) {
      state.screens = state.screens.filter(c => c.name !== screen.name)
      // Remove screen from current page as well
      state.pages[pageName]._screens = state.pages[pageName]._screens.filter(
        scr => scr.name !== screen.name
      )
      api.delete(`/api/screens/${screen._id}/${screen._rev}`)
    }
    return state
  })
}

// const savePage = store => async page => {
//   store.update(state => {
//     if (state.currentFrontEndType !== "page" || !state.currentPageName) {
//       return state
//     }

//     state.pages[state.currentPageName] = page
//     _savePage(state)
//     return state
//   })
// }

const setCurrentPage = store => pageName => {
  store.update(state => {
    const current_screens = state.pages[pageName]._screens

    const currentPage = state.pages[pageName]

    state.currentFrontEndType = "page"
    state.currentView = "detail"
    state.currentPageName = pageName
    state.screens = Array.isArray(current_screens)
      ? current_screens
      : Object.values(current_screens)
    const safeProps = makePropsSafe(
      state.components[currentPage.props._component],
      currentPage.props
    )
    state.currentComponentInfo = safeProps
    currentPage.props = safeProps
    state.currentPreviewItem = state.pages[pageName]
    regenerateCssForCurrentScreen(state)

    for (let screen of state.screens) {
      screen._css = generate_screen_css([screen.props])
    }

    return state
  })
}

/**
 * @param  {string} componentToAdd - name of the component to add to the application
 * @param  {string} presetName - name of the component preset if defined
 */
const addChildComponent = store => (componentToAdd, presetProps = {}) => {
  store.update(state => {
    function findSlot(component_array) {
      for (let i = 0; i < component_array.length; i += 1) {
        if (component_array[i]._component === "##builtin/screenslot") {
          return true
        }

        if (component_array[i]._children) findSlot(component_array[i])
      }

      return false
    }

    if (
      componentToAdd.startsWith("##") &&
      findSlot(state.pages[state.currentPageName].props._children)
    ) {
      return state
    }

    const component = getComponentDefinition(state, componentToAdd)

    const instanceId = get(backendUiStore).selectedDatabase._id
    const instanceName = getNewComponentName(component, state)

    const newComponent = createProps(
      component,
      {
        ...presetProps,
        _instanceId: instanceId,
        _instanceName: instanceName,
      },
      state
    )

    const currentComponent =
      state.components[state.currentComponentInfo._component]

    const targetParent = currentComponent.children
      ? state.currentComponentInfo
      : getParent(state.currentPreviewItem.props, state.currentComponentInfo)

    // Don't continue if there's no parent
    if (!targetParent) {
      return state
    }

    targetParent._children = targetParent._children.concat(newComponent.props)

    state.currentFrontEndType === "page"
      ? _savePage(state)
      : saveScreen(state.currentPreviewItem)

    state.currentView = "component"
    state.currentComponentInfo = newComponent.props
    analytics.captureEvent("Added Component", {
      name: newComponent.props._component,
    })
    return state
  })
}

const selectComponent = store => component => {
  store.update(state => {
    return _selectComponent(state, component)
  })
}

const setComponentProp = store => (name, value) => {
  store.update(state => {
    let current_component = state.currentComponentInfo
    current_component[name] = value

    state.currentComponentInfo = current_component
    _saveCurrentPreviewItem(state)
    return state
  })
}

const setPageOrScreenProp = store => (name, value) => {
  store.update(state => {
    if (name === "_instanceName" && state.currentFrontEndType === "screen") {
      state.currentPreviewItem.props[name] = value
    } else {
      state.currentPreviewItem[name] = value
    }
    _saveCurrentPreviewItem(state)
    return state
  })
}

const setComponentStyle = store => (type, name, value) => {
  store.update(state => {
    if (!state.currentComponentInfo._styles) {
      state.currentComponentInfo._styles = {}
    }
    state.currentComponentInfo._styles[type][name] = value

    regenerateCssForCurrentScreen(state)

    // save without messing with the store
    _saveCurrentPreviewItem(state)
    return state
  })
}

// Select page or screen
const setScreenType = store => type => {
  store.update(state => {
    state.currentFrontEndType = type

    const pageOrScreen =
      type === "page"
        ? state.pages[state.currentPageName]
        : state.pages[state.currentPageName]._screens[0]

    state.currentComponentInfo = pageOrScreen ? pageOrScreen.props : null
    state.currentPreviewItem = pageOrScreen
    state.currentView = "detail"
    return state
  })
}

const getPathToComponent = store => component => {
  // Gets all the components to needed to construct a path.
  const tempStore = get(store)
  let pathComponents = []
  let parent = component
  let root = false
  while (!root) {
    parent = getParent(tempStore.currentPreviewItem.props, parent)
    if (!parent) {
      root = true
    } else {
      pathComponents.push(parent)
    }
  }

  // Remove root entry since it's the screen or page layout.
  // Reverse array since we need the correct order of the IDs
  const reversedComponents = pathComponents.reverse().slice(1)

  // Add component
  const allComponents = [...reversedComponents, component]

  // Map IDs
  const IdList = allComponents.map(c => c._id)

  // Construct ID Path:
  const path = IdList.join("/")

  return path
}

const storeComponentForCopy = store => (component, cut = false) => {
  store.update(s => {
    const copiedComponent = cloneDeep(component)
    s.componentToPaste = copiedComponent
    s.componentToPaste.isCut = cut
    if (cut) {
      const parent = getParent(s.currentPreviewItem.props, component._id)
      parent._children = parent._children.filter(c => c._id !== component._id)
      selectComponent(s, parent)
    }

    return s
  })
}

const pasteComponent = store => (targetComponent, mode) => {
  store.update(s => {
    if (!s.componentToPaste) return s

    const componentToPaste = cloneDeep(s.componentToPaste)
    // retain the same ids as things may be referencing this component
    if (componentToPaste.isCut) {
      // in case we paste a second time
      s.componentToPaste.isCut = false
    } else {
      generateNewIdsForComponent(componentToPaste, s)
    }
    delete componentToPaste.isCut

    if (mode === "inside") {
      targetComponent._children.push(componentToPaste)
      return s
    }

    const parent = getParent(s.currentPreviewItem.props, targetComponent)

    const targetIndex = parent._children.indexOf(targetComponent)
    const index = mode === "above" ? targetIndex : targetIndex + 1
    parent._children.splice(index, 0, cloneDeep(componentToPaste))
    regenerateCssForCurrentScreen(s)
    _saveCurrentPreviewItem(s)
    selectComponent(s, componentToPaste)

    return s
  })
}
