"use client";

import { memo } from "react";
import {
  BarChart3,
  Carrot,
  Database,
  LineChart,
  Package,
  PieChart,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { type IconModalProps,withIconModal } from "../../hoc/withIconModal";
import { canAccess, Permissions } from "../../lib/roles";
import { type ModalAction } from "../../types/component/ModalAction";

const actions: ModalAction[] = [
  { label: "Alloggiati",       icon: Database,  route: "/alloggiati" },
  { label: "Stock",            icon: Package,   route: "/stock" },
  { label: "Ingredients",      icon: Carrot,    route: "/ingredient-stock" },
  { label: "Real Time",        icon: LineChart,  route: "/real-time-dashboard" },
  { label: "Statistics",       icon: BarChart3,  route: "/statistics" },
  { label: "Menu Performance", icon: PieChart,   route: "/menu-performance" },
];

// Build a base modal using the HOC.
const BaseManModal = withIconModal({
  label: "MAN",
  actions,
});

/**
 * Functional component wrapper that allows all users to view the modal
 * while only enabling navigation for users with management access.
 */
function ManModal({ user, ...rest }: IconModalProps) {
  const { user: authUser } = useAuth();
  return (
    <BaseManModal
      {...rest}
      user={user}
      interactive={canAccess(authUser, Permissions.MANAGEMENT_ACCESS)}
    />
  );
}

export default memo(ManModal);
