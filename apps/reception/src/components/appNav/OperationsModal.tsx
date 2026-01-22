/* File: /src/components/appNav/OperationsModal.tsx */
import { withIconModal } from "../../hoc/withIconModal";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  {
    label: "Bar",
    iconClass: "fas fa-cocktail",
    route: "/bar",
  },
  {
    label: "Checkin",
    iconClass: "fas fa-sign-in-alt",
    route: "/checkin",
  },
  {
    label: "View Rooms",
    iconClass: "fas fa-eye",
    route: "/rooms-grid",
  },
  {
    label: "Checkout",
    iconClass: "fas fa-sign-out-alt",
    route: "/checkout",
  },
  {
    label: "Loans",
    iconClass: "fas fa-lock",
    route: "/loan-items",
  },
  {
    label: "Extension",
    iconClass: "fas fa-calendar-plus",
    route: "/extension",
  },
];

export default withIconModal({
  label: "OPERATIONS",
  actions,
});
