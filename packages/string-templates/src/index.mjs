import vm from "vm"
import templates from "./index.js"
import { setJSRunner } from "./helpers/javascript"

/**
 * ES6 entrypoint for rollup
 */
export const isValid = templates.isValid
export const makePropSafe = templates.makePropSafe
export const getManifest = templates.getManifest
export const isJSBinding = templates.isJSBinding
export const encodeJSBinding = templates.encodeJSBinding
export const decodeJSBinding = templates.decodeJSBinding
export const processStringSync = templates.processStringSync
export const processObjectSync = templates.processObjectSync
export const processString = templates.processString
export const processObject = templates.processObject

/**
 * Use polyfilled vm to run JS scripts in a browser Env
 */
setJSRunner((js, context) => {
  vm.createContext(context)
  return vm.runInNewContext(js, context, { timeout: 1000 })
})