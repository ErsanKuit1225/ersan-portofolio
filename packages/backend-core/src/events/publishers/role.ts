import { publishEvent } from "../events"
import {
  Event,
  Role,
  RoleAssignedEvent,
  RoleCreatedEvent,
  RoleDeletedEvent,
  RoleUnassignedEvent,
  RoleUpdatedEvent,
  User,
} from "@budibase/types"

export async function created(role: Role, timestamp?: string | number) {
  const properties: RoleCreatedEvent = {
    roleId: role._id as string,
    permissionId: role.permissionId,
    inherits: role.inherits,
  }
  await publishEvent(Event.ROLE_CREATED, properties, timestamp)
}

export async function updated(role: Role) {
  const properties: RoleUpdatedEvent = {
    roleId: role._id as string,
    permissionId: role.permissionId,
    inherits: role.inherits,
  }
  await publishEvent(Event.ROLE_UPDATED, properties)
}

export async function deleted(role: Role) {
  const properties: RoleDeletedEvent = {
    roleId: role._id as string,
    permissionId: role.permissionId,
    inherits: role.inherits,
  }
  await publishEvent(Event.ROLE_DELETED, properties)
}

export async function assigned(user: User, roleId: string, timestamp?: number) {
  const properties: RoleAssignedEvent = {
    userId: user._id as string,
    roleId,
  }
  await publishEvent(Event.ROLE_ASSIGNED, properties, timestamp)
}

export async function unassigned(user: User, roleId: string) {
  const properties: RoleUnassignedEvent = {
    userId: user._id as string,
    roleId,
  }
  await publishEvent(Event.ROLE_UNASSIGNED, properties)
}
