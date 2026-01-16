"use client";

import { memo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faCashRegister,
  faUserCheck,
  faSignOutAlt,
  faDoorOpen,
  faHandHolding,
  faCalendarPlus,
  faShieldAlt,
  faTools,
  faStream,
  faChartArea,
  faFileAlt,
  faClipboardList,
  faCreditCard,
  faToggleOn,
  faSearch,
  faDatabase,
  faBoxes,
  faCarrot,
  faChartLine,
  faChartBar,
  faChartPie,
  faBed,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { Permissions, canAccess } from "../../lib/roles";
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
      <button
        onClick={toggleNav}
        className="fixed start-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed start-0 top-0 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 dark:bg-darkSurface flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-darkBorder">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-darkAccentGreen">
              Reception
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.user_name}
            </p>
          </div>
          <button
            onClick={closeNav}
            className="min-h-11 min-w-11 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-darkBorder"
            aria-label="Close navigation"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto p-4">
          {navSections.map((section) => {
            if (!canAccessSection(section.permission)) return null;

            return (
              <div key={section.label} className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {section.label}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    if (!canAccessSection(item.permission)) return null;

                    const isActive = pathname === item.route;

                    return (
                      <li key={item.route}>
                        <button
                          onClick={() => navigateTo(item.route)}
                          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-darkAccentGreen"
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-darkBorder"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            className="w-4 text-center"
                          />
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray-200 p-4 dark:border-darkBorder">
          <button
            onClick={onLogout}
            className="flex min-h-11 min-w-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 text-center" />
            Sign out
          </button>
        </div>
      </nav>

      {/* Keyboard shortcut hint (only shown when nav is closed) */}
      {!isOpen && (
        <div className="fixed bottom-4 left-4 z-30 rounded-lg bg-gray-800/80 px-3 py-1.5 text-xs text-white opacity-50 backdrop-blur-sm">
          <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono">
            Arrow Up/Down
          </kbd>{" "}
          for modals
        </div>
      )}
    </div>
  );
}

export default memo(AppNav);
