import { store } from "builderStore"
import { get } from "svelte/store"

import NavigateTo from "./NavigateTo.svelte"
import SaveRow from "./SaveRow.svelte"
import DeleteRow from "./DeleteRow.svelte"
import ExecuteQuery from "./ExecuteQuery.svelte"
import TriggerAutomation from "./TriggerAutomation.svelte"
import ValidateForm from "./ValidateForm.svelte"
import LogOut from "./LogOut.svelte"
import ClearForm from "./ClearForm.svelte"
import CloseScreenModal from "./CloseScreenModal.svelte"
import ChangeFormStep from "./ChangeFormStep.svelte"
import UpdateStateStep from "./UpdateState.svelte"
import RefreshDataProvider from "./RefreshDataProvider.svelte"
import DuplicateRow from "./DuplicateRow.svelte"

// Defines which actions are available to configure in the front end.
// Unfortunately the "name" property is used as the identifier so please don't
// change them.
// The client library removes any spaces when processing actions, so they can
// be considered as camel case too.
// There is technical debt here to sanitize all these and standardise them
// across the packages but it's a breaking change to existing apps.
export const getAvailableActions = () => {
  let actions = [
    {
      name: "Save Row",
      component: SaveRow,
    },
    {
      name: "Duplicate Row",
      component: DuplicateRow,
    },
    {
      name: "Delete Row",
      component: DeleteRow,
    },
    {
      name: "Navigate To",
      component: NavigateTo,
    },
    {
      name: "Execute Query",
      component: ExecuteQuery,
    },
    {
      name: "Trigger Automation",
      component: TriggerAutomation,
    },
    {
      name: "Validate Form",
      component: ValidateForm,
    },
    {
      name: "Log Out",
      component: LogOut,
    },
    {
      name: "Clear Form",
      component: ClearForm,
    },
    {
      name: "Close Screen Modal",
      component: CloseScreenModal,
    },
    {
      name: "Change Form Step",
      component: ChangeFormStep,
    },
    {
      name: "Refresh Data Provider",
      component: RefreshDataProvider,
    },
  ]

  if (get(store).clientFeatures?.state) {
    actions.push({
      name: "Update State",
      component: UpdateStateStep,
    })
  }

  return actions
}
