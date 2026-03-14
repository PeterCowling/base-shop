/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-101 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */
/* eslint-disable ds/no-raw-typography, ds/no-arbitrary-tailwind -- BOS-PI-102 hero glass tokens not yet in design-system registry [ttl=2026-06-30] */

import Link from "next/link";

import {
  InProgressCountBadge,
  InProgressInbox,
  LiveNewIdeasCount,
} from "@/components/process-improvements/InProgressInbox";
import { collectInProgressDispatchIds, loadActivePlans } from "@/lib/process-improvements/active-plans";
import { loadProcessImprovementsProjection } from "@/lib/process-improvements/projection";

export const dynamic = "force-dynamic";

export default async function InProgressPage() {
  const projection = await loadProcessImprovementsProjection();
  const activePlans = loadActivePlans();
  const inProgressDispatchIds = collectInProgressDispatchIds(activePlans);

  return (
    <main className="min-h-dvh text-fg">
      <section className="relative overflow-hidden bg-cmd-hero text-hero-foreground">
        <div
          className="relative mx-auto w-full px-4 py-10 md:px-6 md:py-14"
          style={{ maxWidth: "88rem" }}
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] hero-label">
                Business OS
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                In Progress
              </h1>
              <p className="text-base leading-7 hero-subtitle" style={{ maxWidth: "36rem" }}>
                Active plans currently being worked on.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex min-w-32 flex-col items-center rounded-2xl border backdrop-blur-md px-5 py-4 border-[var(--hero-border-glass)] bg-[var(--hero-bg-glass)]">
                <p className="text-3xl font-bold tabular-nums text-hero-foreground">
                  <InProgressCountBadge initialActivePlans={activePlans} />
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider hero-stat-label">In progress</p>
              </div>
              <Link
                href="/process-improvements/new-ideas"
                className="flex min-w-32 flex-col items-center rounded-2xl border backdrop-blur-md px-5 py-4 transition-all border-[var(--hero-border-glass)] bg-[var(--hero-bg-glass)] hover:bg-[var(--hero-bg-glass-hover)] hover:border-[var(--hero-border-glass-hover)]"
              >
                <p className="text-3xl font-bold tabular-nums text-hero-foreground">
                  <LiveNewIdeasCount
                    initialItems={projection.items}
                    initialInProgressDispatchIds={[...inProgressDispatchIds]}
                  />
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider hero-stat-label">Awaiting decision</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div
        className="mx-auto w-full px-4 py-6 md:px-6 md:py-8"
        style={{ maxWidth: "88rem" }}
      >
        <InProgressInbox initialActivePlans={activePlans} />
      </div>
    </main>
  );
}
