const dayjs = require("dayjs")
dayjs.extend(require("dayjs/plugin/duration"))
dayjs.extend(require("dayjs/plugin/advancedFormat"))
dayjs.extend(require("dayjs/plugin/relativeTime"))

/**
 * This file was largely taken from the helper-date package - we did this for two reasons:
 * 1. It made use of both moment of date.js - this caused some weird bugs with some relatively simple
 * syntax and didn't offer much in return.
 * 2. Replacing moment with dayjs helps massively reduce bundle size.
 * The original package can be found here:
 * https://github.com/helpers/helper-date
 */

function isOptions(val) {
  return typeof val === "object" && typeof val.hash === "object"
}

function isApp(thisArg) {
  return (
    typeof thisArg === "object" &&
    typeof thisArg.options === "object" &&
    typeof thisArg.app === "object"
  )
}

function getContext(thisArg, locals, options) {
  if (isOptions(thisArg)) {
    return getContext({}, locals, thisArg)
  }
  // ensure args are in the correct order
  if (isOptions(locals)) {
    return getContext(thisArg, options, locals)
  }
  const appContext = isApp(thisArg) ? thisArg.context : {}
  options = options || {}

  // if "options" is not handlebars options, merge it onto locals
  if (!isOptions(options)) {
    locals = Object.assign({}, locals, options)
  }
  // merge handlebars root data onto locals if specified on the hash
  if (isOptions(options) && options.hash.root === true) {
    locals = Object.assign({}, options.data.root, locals)
  }
  let context = Object.assign({}, appContext, locals, options.hash)
  if (!isApp(thisArg)) {
    context = Object.assign({}, thisArg, context)
  }
  if (isApp(thisArg) && thisArg.view && thisArg.view.data) {
    context = Object.assign({}, context, thisArg.view.data)
  }
  return context
}

function initialSteps(str, pattern, options) {
  if (isOptions(pattern)) {
    options = pattern
    pattern = null
  }

  if (isOptions(str)) {
    options = str
    pattern = null
    str = null
  }
  return {str, pattern, options}
}

function setLocale(str, pattern, options) {
  // if options is null then it'll get updated here
  ({str, pattern, options} = initialSteps(str, pattern, options))
  const defaults = { lang: "en", date: new Date(str) }
  const opts = getContext(this, defaults, options)

  // set the language to use
  dayjs.locale(opts.lang || opts.language)
}

module.exports.date = (str, pattern, options) => {
  ({str, pattern, options} = initialSteps(str, pattern, options))

  // if no args are passed, return a formatted date
  if (str == null && pattern == null) {
    dayjs.locale("en")
    return dayjs().format("MMMM DD, YYYY")
  }

  setLocale(str, pattern, options)

  return dayjs(new Date(str)).format(pattern)
}

module.exports.duration = (str, pattern, format) => {
  ({str, pattern} = initialSteps(str, pattern))

  setLocale(str, pattern)

  const duration = dayjs.duration(str, pattern)
  if (!isOptions(format)) {
    return duration.format(format)
  } else {
    return duration.humanize()
  }
}
