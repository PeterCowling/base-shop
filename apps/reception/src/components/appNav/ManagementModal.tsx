import {
  ClipboardList,
  CreditCard,
  Search,
  ToggleRight,
  Users,
} from "lucide-react";

import { withIconModal } from "../../hoc/withIconModal";
import { Permissions } from "../../lib/roles";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  { label: "Prepare",     icon: ClipboardList, route: "/prepare-dashboard" },
  { label: "Prepayments", icon: CreditCard,    route: "/prepayments" },
  { label: "Opt-In",      icon: ToggleRight,   route: "/email-automation" },
  { label: "Search",      icon: Search,        route: "/audit" },
  {
    label: "Staff Accounts",
    icon: Users,
    route: "/staff-accounts",
    permission: Permissions.USER_MANAGEMENT,
    peteOnly: true,
  },
];

export default withIconModal({
  label: "MANAGEMENT",
  actions,
});
