import { auth } from "../stores/portal"
import { get } from "svelte/store"

export const TENANT_FEATURE_FLAGS = {
  LICENSING: "LICENSING",
  USER_GROUPS: "USER_GROUPS",
  ONBOADING_TOUR: "ONBOADING_TOUR",
}

export const isEnabled = featureFlag => {
  const user = get(auth).user
  return !!user?.featureFlags?.includes(featureFlag)
}
