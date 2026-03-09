import { withIconModal } from "../../hoc/withIconModal";

import { navSections, SECTION_LABELS } from "./navConfig";

// Admin section carries permissionKey: Permissions.MANAGEMENT_ACCESS, so the HOC
// computes interactive internally — no wrapper component needed (Divergence #useAuth dedup).
// peteOnly filtering for Staff Accounts is handled inside withIconModal.
const section = navSections.find((s) => s.label === SECTION_LABELS.ADMIN);
const actions = (section?.items ?? []).filter((item) => !item.sidebarOnly);

export default withIconModal({
  label: "MAN",
  actions,
  permissionKey: section?.permissionKey,
});
