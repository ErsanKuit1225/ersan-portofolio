export const TableNames = {
  USERS: "ta_users",
}

// fields on the user table that cannot be edited
export const UNEDITABLE_USER_FIELDS = ["username", "password", "accessLevelId"]

export const DEFAULT_LAYOUTS = {
  main: {
    props: {
      _component: "@budibase/standard-components/container",
    },
  },
  unauthenticated: {
    props: {
      _component: "@budibase/standard-components/container",
    },
  },
  componentLibraries: [],
  stylesheets: [],
}
