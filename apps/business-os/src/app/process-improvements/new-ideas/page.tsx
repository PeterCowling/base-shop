/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-101 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

import { NewIdeasInbox } from "@/components/process-improvements/NewIdeasInbox";
import { collectInProgressDispatchIds, loadActivePlans } from "@/lib/process-improvements/active-plans";
import { loadProcessImprovementsProjection } from "@/lib/process-improvements/projection";

export const dynamic = "force-dynamic";

export default async function NewIdeasPage() {
  const projection = await loadProcessImprovementsProjection();
  const activePlans = loadActivePlans();
  const inProgressDispatchIds = [...collectInProgressDispatchIds(activePlans)];

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <section className="relative overflow-hidden border-b border-border-2 bg-cmd-hero text-hero-foreground">
        {/* Glass background layer — blurs hero gradient for glassmorphism effect */}
        <div className="absolute inset-0 glass-panel" aria-hidden="true" />
        <div
          className="relative mx-auto w-full px-4 py-6 md:px-6 md:py-8"
          style={{ maxWidth: "88rem" }}
        >
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
