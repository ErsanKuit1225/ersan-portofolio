export enum PlanType {
  FREE = "free",
  /** @deprecated */
  PRO = "pro",
  /** @deprecated */
  TEAM = "team",
  /** @deprecated */
  PREMIUM = "premium",
  PREMIUM_PLUS = "premium_plus",
  /** @deprecated */
  BUSINESS = "business",
  ENTERPRISE_BASIC = "enterprise_basic",
  ENTERPRISE = "enterprise",
}

export enum PriceDuration {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export interface AvailablePlan {
  type: PlanType
  maxUsers: number
  prices: AvailablePrice[]
}

export interface AvailablePrice {
  amount: number
  amountMonthly: number
  currency: string
  duration: PriceDuration
  priceId: string
  type?: string
}

export enum PlanModel {
  PER_USER = "perUser",
  PER_CREATOR_PER_USER = "per_creator_per_user",
  DAY_PASS = "dayPass",
}

export interface PurchasedPlan {
  type: PlanType
  model: PlanModel
  usesInvoicing: boolean
  price?: PurchasedPrice
}

export interface PurchasedPrice extends AvailablePrice {
  dayPasses: number | undefined
  /** @deprecated - now at the plan level via model */
  isPerUser: boolean
}
