export enum PingSource {
  BUILDER = "builder",
  APP = "app",
}

export interface AnalyticsPingRequest {
  source: PingSource
}
