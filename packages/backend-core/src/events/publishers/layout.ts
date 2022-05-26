import { publishEvent } from "../events"
import {
  Event,
  Layout,
  LayoutCreatedEvent,
  LayoutDeletedEvent,
} from "@budibase/types"

export async function created(layout: Layout, timestamp?: string) {
  const properties: LayoutCreatedEvent = {
    layoutId: layout._id as string,
  }
  await publishEvent(Event.LAYOUT_CREATED, properties, timestamp)
}

export async function deleted(layout: Layout) {
  const properties: LayoutDeletedEvent = {
    layoutId: layout._id as string,
  }
  await publishEvent(Event.LAYOUT_DELETED, properties)
}
