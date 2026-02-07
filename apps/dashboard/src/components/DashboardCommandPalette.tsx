"use client";

import { useMemo,useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowUpCircle,
  ClipboardList,
  History,
  Home,
  RefreshCw,
  Store,
} from "lucide-react";

import {
  type CommandGroup,
  CommandPalette,
} from "@acme/ui/operations";

export function DashboardCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const groups = useMemo<CommandGroup[]>(() => {
    return [
      {
        id: "navigation",
        heading: "Navigation",
        commands: [
          {
            id: "dashboard",
            label: "Dashboard",
            description: "Go to main dashboard",
            icon: Home,
            shortcut: "⌘1",
            onSelect: () => router.push("/dashboard"),
            keywords: ["home", "main"],
          },
          {
            id: "shops",
            label: "Shops",
            description: "View all shops",
            icon: Store,
            shortcut: "⌘2",
            onSelect: () => router.push("/shops"),
            keywords: ["stores", "list"],
          },
          {
            id: "workboard",
            label: "Workboard",
            description: "View workboard tasks",
            icon: ClipboardList,
            shortcut: "⌘3",
            onSelect: () => router.push("/workboard"),
            keywords: ["tasks", "todo"],
          },
          {
            id: "history",
            label: "History",
            description: "View upgrade history",
            icon: History,
            shortcut: "⌘4",
            onSelect: () => router.push("/history"),
            keywords: ["log", "past"],
          },
          {
            id: "upgrade",
            label: "Upgrade",
            description: "Start new upgrade",
            icon: ArrowUpCircle,
            shortcut: "⌘U",
            onSelect: () => router.push("/Upgrade"),
            keywords: ["update", "new"],
          },
        ],
      },
      {
        id: "actions",
        heading: "Actions",
        commands: [
          {
            id: "refresh",
            label: "Refresh Page",
            description: "Reload the current page",
            icon: RefreshCw,
            shortcut: "⌘R",
            onSelect: () => router.reload(),
            keywords: ["reload"],
          },
        ],
      },
    ];
  }, [router]);

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      groups={groups}
      placeholder="Search commands..."
    />
  );
}
