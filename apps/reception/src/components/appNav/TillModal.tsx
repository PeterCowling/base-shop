import { withIconModal } from "../../hoc/withIconModal";

import { navSections, SECTION_LABELS } from "./navConfig";

// Till & Safe section carries permissionKey: Permissions.TILL_ACCESS, so the HOC
// computes interactive internally — no wrapper component needed (Divergence #useAuth dedup).
const section = navSections.find((s) => s.label === SECTION_LABELS.TILL_AND_SAFE);
const actions = (section?.items ?? []).filter((item) => !item.sidebarOnly);

export default withIconModal({
  label: "TILL",
  actions,
  permissionKey: section?.permissionKey,
});
