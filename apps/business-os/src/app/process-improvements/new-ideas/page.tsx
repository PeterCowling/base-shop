/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-101 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

import Link from "next/link";

import { NewIdeasInbox } from "@/components/process-improvements/NewIdeasInbox";
import { collectInProgressDispatchIds, loadActivePlans } from "@/lib/process-improvements/active-plans";
import { loadProcessImprovementsProjection } from "@/lib/process-improvements/projection";

export const dynamic = "force-dynamic";

export default async function NewIdeasPage() {
  const projection = await loadProcessImprovementsProjection();
  const activePlans = loadActivePlans();
  const inProgressDispatchIds = [...collectInProgressDispatchIds(activePlans)];

  const inProgressCount = activePlans.length;
  const inProgressSet = new Set(inProgressDispatchIds);
  const activeItems = projection.items.filter((item) => item.statusGroup === "active");
  const newIdeasCount = activeItems.filter(
    (item) =>
      item.itemType !== "process_improvement" || !inProgressSet.has(item.dispatchId)
  ).length;
  const deferredCount = projection.items.filter(
    (item) => item.statusGroup === "deferred"
  ).length;

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <section className="relative overflow-hidden border-b border-border-2 bg-hero-contrast text-hero-foreground">
        <div
          className="relative mx-auto w-full px-4 py-6 md:px-6 md:py-8"
          style={{ maxWidth: "88rem" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-hero-foreground/60">
                Business OS
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Operator Inbox
              </h1>
              <p className="text-sm leading-6 text-hero-foreground/72" style={{ maxWidth: "36rem" }}>
                Triage the queue, clear operator actions, keep the worklist moving.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/process-improvements/in-progress"
                className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3 transition-colors hover:bg-hero-foreground/16"
              >
                <p className="text-2xl font-semibold tabular-nums">{inProgressCount}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">In progress</p>
              </Link>
              <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{newIdeasCount}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">New ideas</p>
              </div>
              <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{deferredCount}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">Deferred</p>
              </div>
              <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{projection.recentActions.length}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">Done</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className="mx-auto w-full px-4 py-6 md:px-6 md:py-8"
        style={{ maxWidth: "88rem" }}
      >
        <NewIdeasInbox
          initialItems={projection.items}
          initialRecentActions={projection.recentActions}
          initialInProgressDispatchIds={inProgressDispatchIds}
        />
      </div>
    </main>
  );
}
