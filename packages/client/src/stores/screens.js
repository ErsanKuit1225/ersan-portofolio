import { derived } from "svelte/store"
import { routeStore } from "./routes"
import { builderStore } from "./builder"
import { appStore } from "./app"
import { RoleUtils } from "@budibase/frontend-core"
import {
  findComponentById,
  findComponentPathById,
} from "../utils/components.js"
import { Helpers } from "@budibase/bbui"

const createScreenStore = () => {
  const store = derived(
    [appStore, routeStore, builderStore],
    ([$appStore, $routeStore, $builderStore]) => {
      let activeLayout, activeScreen
      let screens

      if ($builderStore.inBuilder) {
        // Use builder defined definitions if inside the builder preview
        activeScreen = Helpers.cloneDeep($builderStore.screen)
        screens = [activeScreen]

        // Legacy - allow the builder to specify a layout
        if ($builderStore.layout) {
          activeLayout = $builderStore.layout
        }
      } else {
        // Find the correct screen by matching the current route
        screens = $appStore.screens || []
        if ($routeStore.activeRoute) {
          activeScreen = Helpers.cloneDeep(
            screens.find(
              screen => screen._id === $routeStore.activeRoute.screenId
            )
          )
        }

        // Legacy - find the custom layout for the selected screen
        if (activeScreen) {
          const screenLayout = $appStore.layouts?.find(
            layout => layout._id === activeScreen.layoutId
          )
          if (screenLayout) {
            activeLayout = screenLayout
          }
        }
      }

      // Insert DND placeholder if required
      const { dndTarget, dndMode, selectedComponentId } = $builderStore
      const insert = false
      if (insert && activeScreen && dndTarget && dndMode) {
        let selectedComponent = findComponentById(
          activeScreen.props,
          selectedComponentId
        )
        const placeholder = {
          ...selectedComponent,
          _id: "placeholder",
          static: true,
        }
        // delete selectedComponent._component
        if (dndMode === "inside") {
          const target = findComponentById(activeScreen.props, dndTarget)
          target._children = [placeholder]
        } else {
          const path = findComponentPathById(activeScreen.props, dndTarget)
          const parent = path?.[path.length - 2]
          if (parent) {
            const idx = parent._children.findIndex(x => x._id === dndTarget)
            const delta = dndMode === "below" ? 1 : -1
            parent._children.splice(idx + delta, 0, placeholder)
          }
        }
      }

      // Assign ranks to screens, preferring higher roles and home screens
      screens.forEach(screen => {
        const roleId = screen.routing.roleId
        let rank = RoleUtils.getRolePriority(roleId)
        if (screen.routing.homeScreen) {
          rank += 100
        }
        screen.rank = rank
      })

      // Sort screens so the best route is first
      screens = screens.sort((a, b) => {
        // First sort by rank
        if (a.rank !== b.rank) {
          return a.rank > b.rank ? -1 : 1
        }
        // Then sort alphabetically
        return a.routing.route < b.routing.route ? -1 : 1
      })

      // If we don't have a legacy custom layout, build a layout structure
      // from the screen navigation settings
      if (!activeLayout) {
        let navigationSettings = {
          navigation: "None",
          pageWidth: activeScreen?.width || "Large",
        }
        if (activeScreen?.showNavigation) {
          navigationSettings = {
            ...navigationSettings,
            ...($builderStore.navigation || $appStore.application?.navigation),
          }

          // Default navigation to top
          if (!navigationSettings.navigation) {
            navigationSettings.navigation = "Top"
          }

          // Default title to app name
          if (!navigationSettings.title && !navigationSettings.hideTitle) {
            navigationSettings.title = $appStore.application?.name
          }
        }
        activeLayout = {
          _id: "layout",
          props: {
            _component: "@budibase/standard-components/layout",
            _children: [
              {
                _component: "screenslot",
                _id: "screenslot",
                _styles: {
                  normal: {
                    flex: "1 1 auto",
                    display: "flex",
                    "flex-direction": "column",
                    "justify-content": "flex-start",
                    "align-items": "stretch",
                  },
                },
              },
            ],
            ...navigationSettings,
          },
        }
      }

      return { screens, activeLayout, activeScreen }
    }
  )

  return {
    subscribe: store.subscribe,
  }
}

export const screenStore = createScreenStore()
