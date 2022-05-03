jest.mock("../../../events", () => {
  return {
    account: {
      created: jest.fn(),
      deleted: jest.fn(),
      verified: jest.fn(),
    },
    app: {
      created: jest.fn(),
      updated: jest.fn(),
      deleted: jest.fn(),
      published: jest.fn(),
      unpublished: jest.fn(),
      templateImported: jest.fn(),
      fileImported: jest.fn(),
      versionUpdated: jest.fn(),
      versionReverted: jest.fn(),
      reverted: jest.fn(),
      exported: jest.fn(),
    },
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      SSOCreated: jest.fn(),
      SSOUpdated: jest.fn(),
      SSOActivated: jest.fn(),
      SSODeactivated: jest.fn(),
    },
    automation: {
      created: jest.fn(),
      deleted: jest.fn(),
      tested: jest.fn(),
      // run: jest.fn(),
      stepCreated: jest.fn(),
      stepDeleted: jest.fn(),
      triggerUpdated: jest.fn(),
    },
    datasource: {
      created: jest.fn(),
      updated: jest.fn(),
      deleted: jest.fn(),
    },
    email: {
      SMTPCreated: jest.fn(),
      SMTPUpdated: jest.fn(),
    },
    layout: {
      created: jest.fn(),
      deleted: jest.fn(),
    },
    org: {
      nameUpdated: jest.fn(),
      logoUpdated: jest.fn(),
      platformURLUpdated: jest.fn(),
      versionChecked: jest.fn(),
      analyticsOptOut: jest.fn(),
    },
    query: {
      created: jest.fn(),
      updated: jest.fn(),
      deleted: jest.fn(),
      imported: jest.fn(),
      previewed: jest.fn(),
    },
    role: {
      created: jest.fn(),
      updated: jest.fn(),
      deleted: jest.fn(),
      assigned: jest.fn(),
      unassigned: jest.fn(),
    },
    row: {
      imported: jest.fn(),
    },
    screen: {
      created: jest.fn(),
      deleted: jest.fn(),
    },
    user: {
      created: jest.fn(),
      updated: jest.fn(),
      deleted: jest.fn(),
      permissionAdminAssigned: jest.fn(),
      permissionAdminRemoved: jest.fn(),
      permissionBuilderAssigned: jest.fn(),
      permissionBuilderRemoved: jest.fn(),
      invited: jest.fn(),
      inviteAccepted: jest.fn(),
      passwordForceReset: jest.fn(),
      passwordUpdated: jest.fn(),
      passwordResetRequested: jest.fn(),
      passwordReset: jest.fn(),
    },
    serve: {
      servedBuilder: jest.fn(),
      servedApp: jest.fn(),
      servedAppPreview: jest.fn(),
    },
    table: {
      created: jest.fn(),
      updated: jest.fn(),
      deleted: jest.fn(),
      exported: jest.fn(),
      imported: jest.fn(),
      permissionUpdated: jest.fn(),
    },
    view: {
      created: jest.fn(),
      updated: jest.fn(),
      deleted: jest.fn(),
      exported: jest.fn(),
      filterCreated: jest.fn(),
      filterUpdated: jest.fn(),
      filterDeleted: jest.fn(),
      calculationCreated: jest.fn(),
      calculationUpdated: jest.fn(),
      calculationDeleted: jest.fn(),
    },
  }
})

const events = require("../../../events")

module.exports = events
