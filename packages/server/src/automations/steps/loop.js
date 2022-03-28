exports.definition = {
  name: "Looping",
  icon: "Reuse",
  tagline: "Loop the block",
  description: "Loop",
  stepId: "LOOP",
  internal: true,
  inputs: {},
  schema: {
    inputs: {
      properties: {
        option: {
          customType: "loopOption",
          title: "Input type",
        },
        binding: {
          type: "string",
          title: "Binding / Value",
        },
        iterations: {
          type: "number",
          title: "Max loop iterations",
        },
        failure: {
          type: "string",
          title: "Failure Condition",
        },
      },
      required: ["type", "value", "iterations", "failure"],
    },
    outputs: {
      properties: {
        items: {
          customType: "item",
          description: "the item currently being executed",
        },
        success: {
          type: "boolean",
          description: "Whether the message sent successfully",
        },
        iterations: {
          type: "number",
          descriptions: "The amount of times the block ran",
        },
      },
      required: ["success"],
    },
  },
  type: "LOGIC",
}

exports.run = async function filter({ inputs }) {
  let currentItem = inputs.binding
  return { currentItem }
}
