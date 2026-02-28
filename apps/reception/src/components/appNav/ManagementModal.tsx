import {
  ClipboardList,
  CreditCard,
  Search,
  ToggleRight,
} from "lucide-react";

import { withIconModal } from "../../hoc/withIconModal";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  { label: "Prepare",     icon: ClipboardList, route: "/prepare-dashboard" },
  { label: "Prepayments", icon: CreditCard,    route: "/prepayments" },
  { label: "Opt-In",      icon: ToggleRight,   route: "/email-automation" },
  { label: "Search",      icon: Search,        route: "/audit" },
];

export default withIconModal({
  label: "MANAGEMENT",
  actions,
});
