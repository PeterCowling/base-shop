/* File: /src/components/appNav/TillModal.tsx */

import { memo } from "react";

import { type IconModalProps,withIconModal } from "../../hoc/withIconModal";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  {
    label: "Till",
    iconClass: "fas fa-cash-register",
    route: "/till-reconciliation",
  },
  {
    label: "Safe",
    iconClass: "fas fa-shield-alt",
    route: "/safe-reconciliation",
  },
  {
    label: "Workbench",
    iconClass: "fas fa-tools",
    route: "/reconciliation-workbench",
  },
  {
    label: "Live",
    iconClass: "fas fa-stream",
    route: "/live",
  },
  {
    label: "Variance",
    iconClass: "fas fa-chart-area",
    route: "/variance-heatmap",
  },
  {
    label: "End of Day",
    iconClass: "fas fa-file-alt",
    route: "/end-of-day",
  },
];

// Build a base modal using the HOC.
const BaseTillModal = withIconModal({
  label: "TILL",
  actions,
});

/**
 * Wrapper component so all users can view this modal but
 * only "Pete" can navigate using the icons.
 */
function TillModal({ user, ...rest }: IconModalProps) {
  return (
    <BaseTillModal
      {...rest}
      user={user}
      interactive={user.user_name === "Pete"}
    />
  );
}

export default memo(TillModal);
