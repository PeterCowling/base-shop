"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Inline } from "@acme/design-system/primitives/Inline";
import { cn } from "@acme/design-system/utils/style";

import type { ActivePlanProgress } from "@/lib/process-improvements/active-plans";
import type { ProcessImprovementsInboxItem } from "@/lib/process-improvements/projection";

 

const POLL_INTERVAL_MS = 30_000;
const SNOOZE_STORAGE_KEY = "bos:plan-snooze:v1";

interface SubNavCounts {
  newIdeasCount: number;
  inProgressCount: number;
  hasActiveNow: boolean;
}

interface ItemsApiResponse {
  items: ProcessImprovementsInboxItem[];
  activePlans: ActivePlanProgress[];
  inProgressDispatchIds: string[];
}

function readSnoozeMap(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function isPlanSnoozed(slug: string, snoozeMap: Record<string, string>): boolean {
  const expiry = snoozeMap[slug];
  if (!expiry) return false;
  const expiryMs = Date.parse(expiry);
  if (!Number.isFinite(expiryMs)) return false;
  return Date.now() < expiryMs;
}

export function deriveSubNavCounts(data: ItemsApiResponse): SubNavCounts {
  const inProgressSet = new Set(data.inProgressDispatchIds);

  const newIdeasCount = data.items
    .filter((item) => item.statusGroup === "active")
    .filter(
      (item) =>
        item.itemType !== "process_improvement" ||
        !inProgressSet.has((item as { dispatchId: string }).dispatchId)
    ).length;

  const snoozeMap = readSnoozeMap();
  const inProgressCount = data.activePlans
    .filter((p) => p.tasksTotal === 0 || p.tasksComplete < p.tasksTotal)
    .filter((p) => !isPlanSnoozed(p.slug, snoozeMap)).length;

  const hasActiveNow = data.activePlans.some((p) => p.isActiveNow);

  return { newIdeasCount, inProgressCount, hasActiveNow };
}

function useSubNavCounts(): SubNavCounts | null {
  const [counts, setCounts] = useState<SubNavCounts | null>(null);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!mounted) return;
      try {
        const response = await fetch("/api/process-improvements/items");
        if (!response.ok || !mounted) return;
        const data = (await response.json()) as ItemsApiResponse;
        if (mounted) {
          setCounts(deriveSubNavCounts(data));
        }
      } catch {
        // fail silently — static labels shown when counts are null
      }
    }

    void poll();
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return counts;
}

export function ProcessImprovementsSubNav() {
  const pathname = usePathname();
  const counts = useSubNavCounts();

  return (
    <nav className="border-b border-border bg-surface-1">
      <Inline gap={1} className="mx-auto w-full px-4 py-2 md:px-6" style={{ maxWidth: "88rem" }}>
        <Link
          href="/process-improvements/new-ideas"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === "/process-improvements/new-ideas"
              ? "bg-surface-2 text-fg"
              : "text-muted hover:text-fg hover:bg-surface-2/60"
          )}
        >
          {counts !== null ? `Inbox (${counts.newIdeasCount})` : "Inbox"}
        </Link>
        <Link
          href="/process-improvements/in-progress"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === "/process-improvements/in-progress"
              ? "bg-surface-2 text-fg"
              : "text-muted hover:text-fg hover:bg-surface-2/60"
          )}
        >
          {counts !== null ? `In Progress (${counts.inProgressCount})` : "In Progress"}
          {counts?.hasActiveNow === true && (
            <span
              aria-label="Agent active"
              className="ms-1 inline-block size-2 rounded-full bg-success animate-pulse"
            />
          )}
        </Link>
      </Inline>
    </nav>
  );
}
