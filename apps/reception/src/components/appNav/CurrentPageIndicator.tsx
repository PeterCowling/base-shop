"use client";

import { memo, useMemo } from "react";
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
  Package,
  PieChart,
  Search,
  Shield,
  ToggleRight,
  UserCheck,
  Wrench,
} from "lucide-react";

interface RouteInfo {
  label: string;
  section: string;
  icon: LucideIcon;
  shortcut?: string;
}

const routeMap: Record<string, RouteInfo> = {
  "/": { label: "Dashboard", section: "Reception", icon: Home },
  "/bar": { label: "Bar", section: "Operations", icon: Calculator, shortcut: "1" },
  "/checkin": { label: "Check-in", section: "Operations", icon: UserCheck, shortcut: "2" },
  "/rooms-grid": { label: "Rooms", section: "Operations", icon: Bed, shortcut: "3" },
  "/checkout": { label: "Check-out", section: "Operations", icon: DoorOpen, shortcut: "4" },
  "/loan-items": { label: "Loans", section: "Operations", icon: HandCoins, shortcut: "5" },
  "/extension": { label: "Extension", section: "Operations", icon: CalendarPlus, shortcut: "6" },
  "/prime-requests": { label: "Prime Requests", section: "Operations", icon: Inbox },
  "/till-reconciliation": { label: "Till", section: "Till & Safe", icon: Calculator },
  "/safe-reconciliation": { label: "Safe", section: "Till & Safe", icon: Shield },
  "/reconciliation-workbench": { label: "Workbench", section: "Till & Safe", icon: Wrench },
  "/live": { label: "Live", section: "Till & Safe", icon: List },
  "/variance-heatmap": { label: "Variance", section: "Till & Safe", icon: AreaChart },
  "/end-of-day": { label: "End of Day", section: "Till & Safe", icon: FileText },
  "/prepare-dashboard": { label: "Prepare", section: "Management", icon: ClipboardList },
  "/prepayments": { label: "Prepayments", section: "Management", icon: CreditCard },
  "/email-automation": { label: "Opt-In", section: "Management", icon: ToggleRight },
  "/audit": { label: "Search", section: "Management", icon: Search },
  "/alloggiati": { label: "Alloggiati", section: "Admin", icon: Database },
  "/stock": { label: "Stock", section: "Admin", icon: Package },
  "/ingredient-stock": { label: "Ingredients", section: "Admin", icon: Carrot },
  "/real-time-dashboard": { label: "Real Time", section: "Admin", icon: LineChart },
  "/statistics": { label: "Statistics", section: "Admin", icon: BarChart3 },
  "/menu-performance": { label: "Menu Perf", section: "Admin", icon: PieChart },
};

interface CurrentPageIndicatorProps {
  pathname: string;
}

function CurrentPageIndicatorComponent({ pathname }: CurrentPageIndicatorProps) {
  const routeInfo = useMemo(() => {
    return routeMap[pathname] || { label: "Home", section: "Reception", icon: Home };
  }, [pathname]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{routeInfo.section}</span>
      <span className="text-muted-foreground">/</span>
      <div className="flex items-center gap-2 font-semibold text-primary-main">
        <routeInfo.icon size={16} />
        <span>{routeInfo.label}</span>
        {routeInfo.shortcut && (
          <kbd className="ms-1 rounded-lg bg-surface-3 px-1.5 py-0.5 text-ops-micro font-mono text-muted-foreground">
            {routeInfo.shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}

const CurrentPageIndicator = memo(CurrentPageIndicatorComponent);
export default CurrentPageIndicator;
