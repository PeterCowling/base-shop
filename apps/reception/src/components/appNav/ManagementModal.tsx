/* File: /src/components/appNav/ManagementModal.tsx */
import { withIconModal } from "../../hoc/withIconModal";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  {
    label: "Prepare",
    iconClass: "fas fa-broom",
    route: "/prepare-dashboard",
  },
  {
    label: "Prepayments",
    iconClass: "fas fa-credit-card",
    route: "/prepayments",
  },
  {
    label: "Opt-In",
    iconClass: "fas fa-envelope",
    route: "/email-automation",
  },
  {
    label: "Search",
    iconClass: "fas fa-search",
    route: "/audit",
  },
];

export default withIconModal({
  label: "MANAGEMENT",
  actions,
});
