import {
  Banknote,
  BarChart3,
  Bed,
  CalendarPlus,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Database,
  DoorOpen,
  FileText,
  GlassWater,
  HandCoins,
  Home,
  Inbox,
  Mail,
  Package,
  Search,
  ToggleRight,
  UserCheck,
  Users,
} from "lucide-react";

import { Permissions } from "../../lib/roles";
import { type ModalAction } from "../../types/component/ModalAction";
import type { UserRole } from "../../types/domains/userDomain";

/**
 * Extended nav item that includes all ModalAction fields plus
 * an optional `sidebarOnly` flag for items that should appear
 * in the sidebar (AppNav) but NOT in modal pop-ups.
 */
export interface NavConfigItem extends ModalAction {
  /** When true, item is shown in AppNav sidebar but excluded from modal consumers. */
  sidebarOnly?: boolean;
}

/**
 * Nav section with optional permission guards.
 *
 * - `permission`    – section-level guard for AppNav (same semantics as existing NavSection.permission)
 * - `permissionKey` – HOC interactive gate: when provided, withIconModal calls canAccess internally
 *                     to determine whether the modal renders as interactive or read-only.
 *                     OperationsModal and ManagementModal have no section-level gate; omit for those.
 */
export interface NavSection {
  label: string;
  items: NavConfigItem[];
  /** When set, AppNav hides this entire section for users without this permission. */
  permission?: UserRole[];
  /** When set, withIconModal uses this to compute the interactive flag internally. */
  permissionKey?: UserRole[];
}

/** Exported section label constants — use these instead of magic strings when filtering by section. */
export const SECTION_LABELS = {
  OPERATIONS: "Operations",
  TILL_AND_SAFE: "Till & Safe",
  MANAGEMENT: "Management",
  ADMIN: "Admin",
} as const;

export const navSections: NavSection[] = [
  {
    label: SECTION_LABELS.OPERATIONS,
    items: [
      // Divergence #1: Dashboard is sidebar-only — it is the root route; modals are sub-page shortcuts.
      { label: "Dashboard",      icon: Home,        route: "/",              sidebarOnly: true },
      { label: "Bar",            icon: GlassWater,  route: "/bar" },         // Divergence #3: canonical icon → GlassWater
      { label: "Check-in",       icon: UserCheck,   route: "/checkin" },     // Divergence #3: canonical icon → UserCheck
      { label: "Rooms",          icon: Bed,         route: "/rooms-grid" },
      { label: "Check-out",      icon: DoorOpen,    route: "/checkout" },
      { label: "Loans",          icon: HandCoins,   route: "/loan-items" },  // Divergence #3: canonical icon → HandCoins
      { label: "Extension",      icon: CalendarPlus,route: "/extension" },
      // Divergence #2: Inbox present in OperationsModal but absent from AppNav — add to both.
      { label: "Inbox",          icon: Mail,        route: "/inbox" },
      { label: "Prime Requests", icon: Inbox,       route: "/prime-requests" },
    ],
  },
  {
    label: SECTION_LABELS.TILL_AND_SAFE,
    permission: Permissions.TILL_ACCESS,
    // permissionKey → withIconModal renders as read-only for users without TILL_ACCESS
    permissionKey: Permissions.TILL_ACCESS,
    items: [
      { label: "Cash",       icon: Banknote, route: "/cash" },
      { label: "EOD",        icon: FileText, route: "/eod" },
    ],
  },
  {
    label: SECTION_LABELS.MANAGEMENT,
    items: [
      { label: "Prepare",     icon: ClipboardList, route: "/prepare-dashboard" },
      { label: "Prepayments", icon: CreditCard,    route: "/prepayments" },
      { label: "Opt-In",      icon: ToggleRight,   route: "/email-automation" },
      { label: "Search",      icon: Search,        route: "/audit" },
      // Divergence #4: Staff Accounts belongs in Admin (elevated access function).
      // ManagementModal derives from this section and correctly does NOT include Staff Accounts.
    ],
  },
  {
    label: SECTION_LABELS.ADMIN,
    permission: Permissions.MANAGEMENT_ACCESS,
    // permissionKey → withIconModal renders as read-only for users without MANAGEMENT_ACCESS
    permissionKey: Permissions.MANAGEMENT_ACCESS,
    items: [
      { label: "Alloggiati",    icon: Database,      route: "/alloggiati" },
      { label: "Stock",         icon: Package,       route: "/stock" },
      { label: "Analytics",     icon: BarChart3,     route: "/analytics" },
      { label: "Manager Audit", icon: ClipboardCheck,route: "/manager-audit" },
      {
        label: "Staff Accounts",
        icon: Users,
        route: "/staff-accounts",
        permission: Permissions.USER_MANAGEMENT,
        peteOnly: true,
      },
    ],
  },
];
