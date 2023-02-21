import { Event, HostInfo } from "./events"

export type AuditWriteOpts = {
  appId?: string
  timestamp?: string | number
  userId?: string
  hostInfo?: HostInfo
}

export type AuditLogFn = (
  event: Event,
  metadata: any,
  opts: AuditWriteOpts
) => Promise<any>
