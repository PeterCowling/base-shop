/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-101 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

import { ProcessImprovementsInbox } from "@/components/process-improvements/ProcessImprovementsInbox";
import { loadProcessImprovementsProjection } from "@/lib/process-improvements/projection";

export const dynamic = "force-dynamic";

export default async function ProcessImprovementsPage() {
  const projection = await loadProcessImprovementsProjection();

  return (
    <main className="min-h-dvh bg-bg">
      {/* eslint-disable-next-line ds/container-widths-only-at -- BOS-PI-101 internal operator page, no DS container primitive available */}
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Business OS
          </p>
          <h1 className="mt-2 text-3xl font-bold text-fg">
            Process Improvements
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Proposed workflow improvements awaiting your decision.
          </p>
        </header>

        <ProcessImprovementsInbox
          initialItems={projection.items}
          initialActionedItems={projection.actionedItems}
        />
      </div>
    </main>
  );
}
