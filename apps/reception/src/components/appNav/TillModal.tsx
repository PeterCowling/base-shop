import { memo } from "react";
import {
  Activity,
  AreaChart,
  Calculator,
  FileText,
  Shield,
  Wrench,
} from "lucide-react";

import { type IconModalProps,withIconModal } from "../../hoc/withIconModal";
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
