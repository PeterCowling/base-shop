"use client";

import { memo, useCallback,useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AreaChart,
  BarChart3,
  Bed,
  Calculator,
  CalendarPlus,
  Carrot,
  ClipboardList,
  CreditCard,
  Database,
  DoorOpen,
  FileText,
  HandCoins,
  Home,
  Inbox,
  LineChart,
  List,
  LogOut,
  Menu,
  Package,
  PieChart,
  Search,
  Shield,
  ToggleRight,
  UserCheck,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import { canAccess,Permissions } from "../../lib/roles";
import type { User } from "../../types/domains/userDomain";

interface NavItem {
  label: string;
  route: string;
  icon: LucideIcon;
  permission?: (typeof Permissions)[keyof typeof Permissions];
}

interface NavSection {
  label: string;
  items: NavItem[];
  permission?: (typeof Permissions)[keyof typeof Permissions];
}

const navSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", route: "/", icon: Home },
      { label: "Bar", route: "/bar", icon: Calculator },
      { label: "Check-in", route: "/checkin", icon: UserCheck },
      { label: "Rooms", route: "/rooms-grid", icon: Bed },
      { label: "Check-out", route: "/checkout", icon: DoorOpen },
      { label: "Loans", route: "/loan-items", icon: HandCoins },
      { label: "Extension", route: "/extension", icon: CalendarPlus },
      { label: "Prime Requests", route: "/prime-requests", icon: Inbox },
    ],
  },
  {
    label: "Till & Safe",
    permission: Permissions.TILL_ACCESS,
    items: [
      { label: "Till", route: "/till-reconciliation", icon: Calculator },
      { label: "Safe", route: "/safe-reconciliation", icon: Shield },
      { label: "Workbench", route: "/reconciliation-workbench", icon: Wrench },
      { label: "Live", route: "/live", icon: List },
      { label: "Variance", route: "/variance-heatmap", icon: AreaChart },
      { label: "End of Day", route: "/end-of-day", icon: FileText },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Prepare", route: "/prepare-dashboard", icon: ClipboardList },
      { label: "Prepayments", route: "/prepayments", icon: CreditCard },
      { label: "Opt-In", route: "/email-automation", icon: ToggleRight },
      { label: "Search", route: "/audit", icon: Search },
    ],
  },
  {
    label: "Admin",
    permission: Permissions.MANAGEMENT_ACCESS,
    items: [
      { label: "Alloggiati", route: "/alloggiati", icon: Database },
      { label: "Stock", route: "/stock", icon: Package },
      { label: "Ingredients", route: "/ingredient-stock", icon: Carrot },
      { label: "Real Time", route: "/real-time-dashboard", icon: LineChart },
      { label: "Statistics", route: "/statistics", icon: BarChart3 },
      { label: "Menu Perf", route: "/menu-performance", icon: PieChart },
    ],
  },
];

interface AppNavProps {
  user: { user_name: string; roles?: User["roles"] };
  onLogout: () => void;
}

function AppNav({ user, onLogout }: AppNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleNav = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeNav = useCallback(() => setIsOpen(false), []);

  const navigateTo = useCallback(
    (route: string) => {
      router.push(route);
      closeNav();
    },
    [router, closeNav]
  );

  // Check if user can access a section or item
  const canAccessSection = useCallback(
    (permission?: (typeof Permissions)[keyof typeof Permissions]): boolean => {
      if (!permission) return true;
      // If user has roles array (new system), check roles
      if ("roles" in user && Array.isArray(user.roles)) {
        return canAccess(user as User, permission);
      }
      // Fallback for legacy users: Pete has access to restricted sections
      return user.user_name === "Pete";
    },
    [user]
  );

  return (
    <div className="relative">
      {/* Nav Toggle Button */}
      <Button
        onClick={toggleNav}
        color="primary"
        tone="solid"
        iconOnly
        className="fixed start-4 top-4 shadow-lg"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface/80 backdrop-blur-sm"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed start-0 top-0 h-full w-64 transform bg-surface shadow-xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Reception
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.user_name}
            </p>
          </div>
          <Button
            onClick={closeNav}
            color="default"
            tone="ghost"
            iconOnly
            aria-label="Close navigation"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto p-4">
          {navSections.map((section) => {
            if (!canAccessSection(section.permission)) return null;

            return (
              <div key={section.label} className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    if (!canAccessSection(item.permission)) return null;

                    const isActive = pathname === item.route;

                    return (
                      <li key={item.route}>
                        <Button
                          onClick={() => navigateTo(item.route)}
                          color={isActive ? "primary" : "default"}
                          tone={isActive ? "soft" : "ghost"}
                          size="sm"
                          className="w-full gap-3 justify-start min-h-11"
                        >
                          <item.icon size={16} className="shrink-0" />
                          {item.label}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-border p-4">
          <Button
            onClick={onLogout}
            color="danger"
            tone="ghost"
            size="sm"
            className="w-full gap-3 justify-start min-h-11"
          >
            <LogOut size={16} className="shrink-0" />
            Sign out
          </Button>
        </div>
      </nav>

      {/* Keyboard shortcut hint (only shown when nav is closed) */}
      {!isOpen && (
        <div className="fixed bottom-4 left-4 z-30 rounded-lg bg-surface/90 px-3 py-1.5 text-xs text-primary-fg opacity-50 backdrop-blur-sm">
          <kbd className="rounded-lg bg-surface-3 px-1.5 py-0.5 font-mono">
            Arrow Up/Down
          </kbd>{" "}
          for modals
        </div>
      )}
    </div>
  );
}

export default memo(AppNav);
