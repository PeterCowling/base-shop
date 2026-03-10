import { withIconModal } from "../../hoc/withIconModal";

import { navSections, SECTION_LABELS } from "./navConfig";

const section = navSections.find((s) => s.label === SECTION_LABELS.OPERATIONS);
const actions = (section?.items ?? []).filter((item) => !item.sidebarOnly);

export default withIconModal({
  label: "OPERATIONS",
  actions,
});
