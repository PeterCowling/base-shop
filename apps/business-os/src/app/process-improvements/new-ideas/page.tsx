/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-101 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */
/* eslint-disable ds/no-raw-typography, ds/no-arbitrary-tailwind, ds/no-raw-spacing -- BOS-PI-102 hero glass tokens not yet in design-system registry [ttl=2026-06-30] */

import { NewIdeasInbox } from "@/components/process-improvements/NewIdeasInbox";
import { collectInProgressDispatchIds, loadActivePlans } from "@/lib/process-improvements/active-plans";
import { loadProcessImprovementsProjection } from "@/lib/process-improvements/projection";

export const dynamic = "force-dynamic";

export default async function NewIdeasPage() {
  const projection = await loadProcessImprovementsProjection();
  const activePlans = loadActivePlans();
  const inProgressDispatchIds = [...collectInProgressDispatchIds(activePlans)];

  return (
    <main className="min-h-dvh text-fg">
      <section className="relative overflow-hidden bg-cmd-hero text-hero-foreground">
        <div
          className="relative mx-auto w-full px-4 py-10 md:px-6 md:py-14"
          style={{ maxWidth: "88rem" }}
        >
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] hero-label">
              Business OS
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-hero-foreground md:text-5xl">
              Operator Inbox
            </h1>
            <p className="text-base leading-7 hero-subtitle" style={{ maxWidth: "36rem" }}>
              Triage the queue, clear operator actions, keep the worklist moving.
            </p>
          </div>
        </div>
      </section>

      <div
        className="mx-auto w-full px-4 py-6 md:px-6 md:py-8"
        style={{ maxWidth: "88rem", marginTop: "-1px" }}
      >
        <NewIdeasInbox
          initialItems={projection.items}
          initialRecentActions={projection.recentActions}
          initialInProgressDispatchIds={inProgressDispatchIds}
          initialCompletedIdeasCount={projection.completedIdeasCount}
        />
      </div>
    </main>
  );
}
