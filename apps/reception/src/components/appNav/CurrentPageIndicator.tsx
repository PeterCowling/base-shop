"use client";

import { memo, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCashRegister,
  faUserCheck,
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

interface RouteInfo {
  label: string;
  section: string;
  icon: IconDefinition;
  shortcut?: string;
}

const routeMap: Record<string, RouteInfo> = {
  "/": { label: "Dashboard", section: "Reception", icon: faHome },
  "/bar": { label: "Bar", section: "Operations", icon: faCashRegister, shortcut: "1" },
  "/checkin": { label: "Check-in", section: "Operations", icon: faUserCheck, shortcut: "2" },
  "/rooms-grid": { label: "Rooms", section: "Operations", icon: faBed, shortcut: "3" },
  "/checkout": { label: "Check-out", section: "Operations", icon: faDoorOpen, shortcut: "4" },
  "/loan-items": { label: "Loans", section: "Operations", icon: faHandHolding, shortcut: "5" },
  "/extension": { label: "Extension", section: "Operations", icon: faCalendarPlus, shortcut: "6" },
  "/till-reconciliation": { label: "Till", section: "Till & Safe", icon: faCashRegister },
  "/safe-reconciliation": { label: "Safe", section: "Till & Safe", icon: faShieldAlt },
  "/reconciliation-workbench": { label: "Workbench", section: "Till & Safe", icon: faTools },
  "/live": { label: "Live", section: "Till & Safe", icon: faStream },
  "/variance-heatmap": { label: "Variance", section: "Till & Safe", icon: faChartArea },
  "/end-of-day": { label: "End of Day", section: "Till & Safe", icon: faFileAlt },
  "/prepare-dashboard": { label: "Prepare", section: "Management", icon: faClipboardList },
  "/prepayments": { label: "Prepayments", section: "Management", icon: faCreditCard },
  "/email-automation": { label: "Opt-In", section: "Management", icon: faToggleOn },
  "/audit": { label: "Search", section: "Management", icon: faSearch },
  "/alloggiati": { label: "Alloggiati", section: "Admin", icon: faDatabase },
  "/stock": { label: "Stock", section: "Admin", icon: faBoxes },
  "/ingredient-stock": { label: "Ingredients", section: "Admin", icon: faCarrot },
  "/real-time-dashboard": { label: "Real Time", section: "Admin", icon: faChartLine },
  "/statistics": { label: "Statistics", section: "Admin", icon: faChartBar },
  "/menu-performance": { label: "Menu Perf", section: "Admin", icon: faChartPie },
};

interface CurrentPageIndicatorProps {
  pathname: string;
}

function CurrentPageIndicatorComponent({ pathname }: CurrentPageIndicatorProps) {
  const routeInfo = useMemo(() => {
    return routeMap[pathname] || { label: "Home", section: "Reception", icon: faHome };
  }, [pathname]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 dark:text-gray-500">{routeInfo.section}</span>
      <span className="text-gray-300 dark:text-gray-600">/</span>
      <div className="flex items-center gap-2 font-semibold text-primary-600 dark:text-darkAccentGreen">
        <FontAwesomeIcon icon={routeInfo.icon} className="w-4" />
        <span>{routeInfo.label}</span>
        {routeInfo.shortcut && (
          <kbd className="ms-1 rounded bg-gray-200 px-1.5 py-0.5 text-ops-micro font-mono text-gray-600 dark:bg-darkBorder dark:text-gray-400">
            {routeInfo.shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}

const CurrentPageIndicator = memo(CurrentPageIndicatorComponent);
export default CurrentPageIndicator;
