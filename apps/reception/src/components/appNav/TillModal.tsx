"use client";

import { memo } from "react";
import {
  Activity,
  AreaChart,
  Calculator,
  FileText,
  Shield,
  Wrench,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { type IconModalProps,withIconModal } from "../../hoc/withIconModal";
import { canAccess, Permissions } from "../../lib/roles";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  { label: "Till",       icon: Calculator, route: "/till-reconciliation" },
  { label: "Safe",       icon: Shield,     route: "/safe-reconciliation" },
  { label: "Workbench",  icon: Wrench,     route: "/reconciliation-workbench" },
  { label: "Live",       icon: Activity,   route: "/live" },
  { label: "Variance",   icon: AreaChart,  route: "/variance-heatmap" },
  { label: "End of Day", icon: FileText,   route: "/end-of-day" },
];

// Build a base modal using the HOC.
const BaseTillModal = withIconModal({
  label: "TILL",
  actions,
});

/**
 * Wrapper component so all users can view this modal but
 * only users with till access can navigate using the icons.
 */
function TillModal({ user, ...rest }: IconModalProps) {
  const { user: authUser } = useAuth();
  return (
    <BaseTillModal
      {...rest}
      user={user}
      interactive={canAccess(authUser, Permissions.TILL_ACCESS)}
    />
  );
}

export default memo(TillModal);
