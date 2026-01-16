/* File: /src/components/appNav/ManModal.tsx */
import { memo } from "react";

import { withIconModal, type IconModalProps } from "../../hoc/withIconModal";
import { ModalAction } from "../../types/component/ModalAction";

/**
 * Defines the actions for the "Man" modal. All users can open this modal,
 * but only the user named 'Pete' may navigate via the icons.
 * */
const actions: ModalAction[] = [
  {
    label: "Alloggiati",
    iconClass: "fas fa-database",
    route: "/alloggiati",
  },
  {
    label: "Stock",
    iconClass: "fas fa-boxes",
    route: "/stock",
  },
  {
    label: "Ingredient Stock",
    iconClass: "fas fa-carrot",
    route: "/ingredient-stock",
  },
  {
    label: "Real Time",
    iconClass: "fas fa-chart-line",
    route: "/real-time-dashboard",
  },
  {
    label: "Statistics",
    iconClass: "fas fa-chart-bar",
    route: "/statistics",
  },
  {
    label: "Menu Performance",
    iconClass: "fas fa-chart-pie",
    route: "/menu-performance",
  },
];

// Build a base modal using the HOC.
const BaseManModal = withIconModal({
  label: "MAN",
  actions,
});

/**
 * Functional component wrapper that allows all users to view the modal
 * while only enabling navigation for the user named "Pete".
 */
function ManModal({ user, ...rest }: IconModalProps) {
  return (
    <BaseManModal
      {...rest}
      user={user}
      interactive={user.user_name === "Pete"}
    />
  );
}

export default memo(ManModal);
