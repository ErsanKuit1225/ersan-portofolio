export declare enum FeatureFlag {
    LICENSING = "LICENSING"
}
export interface TenantFeatureFlags {
    [key: string]: FeatureFlag[];
}
