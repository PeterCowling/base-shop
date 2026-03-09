import { withIconModal } from "../../hoc/withIconModal";

import { navSections, SECTION_LABELS } from "./navConfig";

// Management section intentionally does NOT include Staff Accounts — that item
// lives in the Admin section (Divergence #4 decision).
const section = navSections.find((s) => s.label === SECTION_LABELS.MANAGEMENT);
const actions = (section?.items ?? []).filter((item) => !item.sidebarOnly);

export default withIconModal({
  label: "MANAGEMENT",
  actions,
});
