import {
  AutomationActionStepId,
  AutomationStepSchema,
  AutomationStepInput,
  AutomationStepType,
  AutomationIOType,
} from "@budibase/types"

export const definition: AutomationStepSchema = {
  name: "Collect Data",
  tagline: "Collect data to be sent to design",
  icon: "Collection",
  description:
    "Collects specified data so it can be provided to the design section",
  type: AutomationStepType.ACTION,
  internal: true,
  canLoop: false,
  stepId: AutomationActionStepId.COLLECT,
  inputs: {
    text: "",
  },
  schema: {
    inputs: {
      properties: {
        collection: {
          type: AutomationIOType.STRING,
          title: "What to Collect",
        },
      },
      required: ["text"],
    },
    outputs: {
      properties: {
        success: {
          type: AutomationIOType.BOOLEAN,
          description: "Whether the action was successful",
        },
        value: {
          type: AutomationIOType.STRING,
          description: "Collected data",
        },
      },
      required: ["success", "value"],
    },
  },
}

export async function run({ inputs }: AutomationStepInput) {
  return {
    success: true,
    value: inputs.collection,
  }
}
