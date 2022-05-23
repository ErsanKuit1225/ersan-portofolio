import PostHog from "posthog-node"
import { Event, Identity } from "@budibase/types"
import { EventProcessor } from "./types"

export default class PosthogProcessor implements EventProcessor {
  posthog: PostHog

  constructor(token: string | undefined) {
    if (!token) {
      throw new Error("Posthog token is not defined")
    }
    this.posthog = new PostHog(token)
  }

  async processEvent(
    event: Event,
    identity: Identity,
    properties: any
  ): Promise<void> {
    this.posthog.capture({ distinctId: identity.id, event, properties })
  }

  async identify(identity: Identity) {
    this.posthog.identify({ distinctId: identity.id, properties: identity })
  }

  shutdown() {
    this.posthog.shutdown()
  }
}
