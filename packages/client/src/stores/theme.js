import { derived } from "svelte/store"
import { appStore } from "./app"
import { builderStore } from "./builder"

// This is the good old acorn bug where having the word "g l o b a l" makes it
// think that this is not ES6 compatible and starts throwing errors when using
// optional chaining. Piss off acorn.
const defaultTheme = "spectrum--light"
const defaultCustomTheme = {
  primaryColor: "var(--spectrum-glo" + "bal-color-blue-600)",
  primaryColorHover: "var(--spectrum-glo" + "bal-color-blue-500)",
  buttonBorderRadius: "16px",
  navBackground: "var(--spectrum-glo" + "bal-color-gray-100)",
}

const createThemeStore = () => {
  const store = derived(
    [builderStore, appStore],
    ([$builderStore, $appStore]) => {
      const theme =
        $builderStore.theme || $appStore.application?.theme || defaultTheme

      // Delete and nullish keys from the custom theme
      let customTheme =
        $builderStore.customTheme || $appStore.application?.customTheme
      if (customTheme) {
        Object.entries(customTheme).forEach(([key, value]) => {
          if (value == null || value === "") {
            delete customTheme[key]
          }
        })
      }

      // Merge custom theme with defaults
      customTheme = {
        ...defaultCustomTheme,
        ...customTheme,
      }

      // Build CSS string setting all custom variables
      let customThemeCss = ""
      Object.entries(customTheme).forEach(([key, value]) => {
        customThemeCss += `--${key}:${value};`
      })

      return {
        theme,
        customTheme,
        customThemeCss,
      }
    }
  )

  return {
    subscribe: store.subscribe,
  }
}

export const themeStore = createThemeStore()
