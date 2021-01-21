const { HelperFunctions } = require("./helpers/index")

const HBS_CLEANING_REGEX = /{{[^}}]*}}/g
const ALPHA_NUMERIC_REGEX = /^[A-Za-z0-9]+$/g

function isAlphaNumeric(char) {
  return char.match(ALPHA_NUMERIC_REGEX)
}

function swapStrings(string, start, length, swap) {
  return string.slice(0, start) + swap + string.slice(start + length)
}

function handleCleaner(string, match, fn) {
  const output = fn(match)
  const idx = string.indexOf(match)
  return swapStrings(string, idx, match.length, output)
}

function swapToDotNotation(statement) {
  let startBraceIdx = statement.indexOf("[")
  let lastIdx = 0
  while (startBraceIdx !== -1) {
    // if the character previous to the literal specifier is alpha-numeric this should happen
    if (isAlphaNumeric(statement.charAt(startBraceIdx - 1))) {
      statement = swapStrings(statement, startBraceIdx + lastIdx, 1, ".[")
    }
    lastIdx = startBraceIdx + 1
    startBraceIdx = statement.substring(lastIdx + 1).indexOf("[")
  }
  return statement
}

function handleSpacesInProperties(statement) {
  // exclude helpers and brackets, regex will only find double brackets
  const exclusions = HelperFunctions.concat(["{{", "}}"])
  // find all the parts split by spaces
  const splitBySpaces = statement.split(" ")
  // remove the excluded elements
  const propertyParts = splitBySpaces.filter(part => exclusions.indexOf(part) === -1)
  // rebuild to get the full property
  const fullProperty = propertyParts.join(" ")
  // now work out the dot notation layers and split them up
  const propertyLayers = fullProperty.split(".")
  // find the layers which need to be wrapped and wrap them
  for (let layer of propertyLayers) {
    if (layer.indexOf(" ") !== -1) {
      statement = swapStrings(statement, statement.indexOf(layer), layer.length, `[${layer}]`)
    }
  }
  // remove the edge case of double brackets being entered (in-case user already has specified)
  return statement.replace(/\[\[/g, "[").replace(/]]/g, "]")
}

function finalise(statement) {
  let insideStatement = statement.slice(2, statement.length - 2)
  if (insideStatement.charAt(0) === " ") {
    insideStatement = insideStatement.slice(1)
  }
  if (insideStatement.charAt(insideStatement.length - 1) === " ") {
    insideStatement = insideStatement.slice(0, insideStatement.length - 1)
  }
  return `{{ all (${insideStatement}) }}`
}

/**
 * When running handlebars statements to execute on the context of the automation it possible user's may input handlebars
 * in a few different forms, some of which are invalid but are logically valid. An example of this would be the handlebars
 * statement "{{steps[0].revision}}" here it is obvious the user is attempting to access an array or object using array
 * like operators. These are not supported by handlebars and therefore the statement will fail. This function will clean up
 * the handlebars statement so it instead reads as "{{steps.0.revision}}" which is valid and will work. It may also be expanded
 * to include any other handlebars statement cleanup that has been deemed necessary for the system.
 *
 * @param {string} string The string which *may* contain handlebars statements, it is OK if it does not contain any.
 * @returns {string} The string that was input with cleaned up handlebars statements as required.
 */
module.exports.cleanHandlebars = (string) => {
  let cleaners = [swapToDotNotation, handleSpacesInProperties, finalise]
  for (let cleaner of cleaners) {
    // re-run search each time incase previous cleaner update/removed a match
    let regex = new RegExp(HBS_CLEANING_REGEX)
    let matches = string.match(regex)
    if (matches == null) {
      continue
    }
    for (let match of matches) {
      string = handleCleaner(string, match, cleaner)
    }
  }
  return string
}