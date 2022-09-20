export interface AccountPlan {
    type: PlanType;
    price?: Price;
}
export declare enum PlanType {
    FREE = "free",
    PRO = "pro",
    BUSINESS = "business",
    ENTERPRISE = "enterprise"
}
export declare enum PriceDuration {
    MONTHLY = "monthly",
    YEARLY = "yearly"
}
export interface Price {
    amount: number;
    amountMonthly: number;
    currency: string;
    duration: PriceDuration;
    priceId: string;
    dayPasses: number;
}
