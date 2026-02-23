"use client";

import { memo, useCallback,useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBars,
  faBed,
  faBoxes,
  faCalendarPlus,
  faCarrot,
  faCashRegister,
  faChartArea,
  faChartBar,
  faChartLine,
  faChartPie,
  faClipboardList,
  faCreditCard,
  faDatabase,
  faDoorOpen,
  faFileAlt,
  faHandHolding,
  faHome,
  faInbox,
  faSearch,
  faShieldAlt,
  faSignOutAlt,
  faStream,
  faTimes,
  faToggleOn,
  faTools,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ReceptionButton as Button } from "@acme/ui/operations";

import { canAccess,Permissions } from "../../lib/roles";
import type { User } from "../../types/domains/userDomain";

interface NavItem {
  label: string;
  route: string;
  icon: IconDefinition;
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
      { label: "Dashboard", route: "/", icon: faHome },
      { label: "Bar", route: "/bar", icon: faCashRegister },
      { label: "Check-in", route: "/checkin", icon: faUserCheck },
      { label: "Rooms", route: "/rooms-grid", icon: faBed },
      { label: "Check-out", route: "/checkout", icon: faDoorOpen },
      { label: "Loans", route: "/loan-items", icon: faHandHolding },
      { label: "Extension", route: "/extension", icon: faCalendarPlus },
      { label: "Prime Requests", route: "/prime-requests", icon: faInbox },
    ],
  },
  {
    label: "Till & Safe",
    permission: Permissions.TILL_ACCESS,
    items: [
      { label: "Till", route: "/till-reconciliation", icon: faCashRegister },
      { label: "Safe", route: "/safe-reconciliation", icon: faShieldAlt },
      { label: "Workbench", route: "/reconciliation-workbench", icon: faTools },
      { label: "Live", route: "/live", icon: faStream },
      { label: "Variance", route: "/variance-heatmap", icon: faChartArea },
      { label: "End of Day", route: "/end-of-day", icon: faFileAlt },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Prepare", route: "/prepare-dashboard", icon: faClipboardList },
      { label: "Prepayments", route: "/prepayments", icon: faCreditCard },
      { label: "Opt-In", route: "/email-automation", icon: faToggleOn },
      { label: "Search", route: "/audit", icon: faSearch },
    ],
  },
  {
    label: "Admin",
    permission: Permissions.MANAGEMENT_ACCESS,
    items: [
      { label: "Alloggiati", route: "/alloggiati", icon: faDatabase },
      { label: "Stock", route: "/stock", icon: faBoxes },
      { label: "Ingredients", route: "/ingredient-stock", icon: faCarrot },
      { label: "Real Time", route: "/real-time-dashboard", icon: faChartLine },
      { label: "Statistics", route: "/statistics", icon: faChartBar },
      { label: "Menu Perf", route: "/menu-performance", icon: faChartPie },
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
        className="fixed start-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-600 text-primary-fg shadow-lg hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed start-0 top-0 h-full w-64 transform bg-surface shadow-xl transition-transform duration-300 dark:bg-darkSurface flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 dark:border-darkBorder">
          <div>
            <h2 className="text-lg font-semibold text-foreground dark:text-darkAccentGreen">
              Reception
            </h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {user.user_name}
            </p>
          </div>
          <Button
            onClick={closeNav}
            className="min-h-11 min-w-11 rounded-lg p-2 text-muted-foreground hover:bg-surface-2 dark:text-muted-foreground dark:hover:bg-darkBorder"
            aria-label="Close navigation"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto p-4">
          {navSections.map((section) => {
            if (!canAccessSection(section.permission)) return null;

            return (
              <div key={section.label} className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
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
                          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-darkAccentGreen"
                              : "text-foreground hover:bg-surface-2 dark:text-gray-300 dark:hover:bg-darkBorder"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            className="w-4 text-center"
                          />
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
        <div className="mt-auto border-t border-border p-4 dark:border-darkBorder">
          <Button
            onClick={onLogout}
            className="flex min-h-11 min-w-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-error-main hover:bg-error-light/20 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 text-center" />
            Sign out
          </Button>
        </div>
      </nav>

      {/* Keyboard shortcut hint (only shown when nav is closed) */}
      {!isOpen && (
        <div className="fixed bottom-4 left-4 z-30 rounded-lg bg-foreground/80 px-3 py-1.5 text-xs text-primary-fg opacity-50 backdrop-blur-sm">
          <kbd className="rounded bg-surface-3 px-1.5 py-0.5 font-mono">
            Arrow Up/Down
          </kbd>{" "}
          for modals
        </div>
      )}
    </div>
  );
}

export default memo(AppNav);
