/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-101 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

import { ProcessImprovementsInbox } from "@/components/process-improvements/ProcessImprovementsInbox";
import { loadProcessImprovementsProjection } from "@/lib/process-improvements/projection";

export const dynamic = "force-dynamic";

export default async function ProcessImprovementsPage() {
  const projection = await loadProcessImprovementsProjection();

  return (
    <main className="min-h-dvh bg-bg p-4 md:p-6">
      <div className="mx-auto w-full space-y-6">
        <header className="rounded-xl border border-border bg-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Business OS
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-fg">
                Process Improvements
              </h1>
              <p className="mt-3 text-sm leading-6 text-secondary">
                Human-in-the-loop inbox for queue-backed improvement ideas. `Do`
                hands the item into the regular route, `Defer` snoozes it for
                seven days, and `Decline` closes it out as an operator rejection.
              </p>
            </div>
            <dl className="rounded-lg border border-border-2 bg-surface-1 px-4 py-3 text-sm text-secondary">
              <div>
                <dt className="font-medium uppercase tracking-wide text-muted">
                  Queue mode
                </dt>
                <dd className="mt-1 text-fg">{projection.queueMode}</dd>
              </div>
              <div className="mt-3">
                <dt className="font-medium uppercase tracking-wide text-muted">
                  Queue source
                </dt>
                <dd className="mt-1 break-all text-fg">{projection.sourcePath}</dd>
              </div>
            </dl>
          </div>
        </header>

        <ProcessImprovementsInbox initialItems={projection.items} />
      </div>
    </main>
  );
}
