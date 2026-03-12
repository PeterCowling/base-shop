/* eslint-disable ds/no-hardcoded-copy -- BOS-PI-101 internal operator UI copy pending i18n extraction [ttl=2026-06-30] */

import Link from "next/link";

import { InProgressInbox } from "@/components/process-improvements/InProgressInbox";
import { loadActivePlans } from "@/lib/process-improvements/active-plans";

export const dynamic = "force-dynamic";

export default function InProgressPage() {
  const activePlans = loadActivePlans();
  const inProgressCount = activePlans.length;

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
                In Progress
              </h1>
              <p className="text-sm leading-6 text-hero-foreground/72" style={{ maxWidth: "36rem" }}>
                Active plans currently being worked on.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{inProgressCount}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">In progress</p>
              </div>
              <Link
                href="/process-improvements/new-ideas"
                className="flex min-w-28 flex-col items-center rounded-xl border border-hero-foreground/16 bg-hero-foreground/8 px-4 py-3 transition-colors hover:bg-hero-foreground/16"
              >
                <p className="text-2xl font-semibold tabular-nums">→</p>
                <p className="text-xs font-medium uppercase tracking-wider text-hero-foreground/60">New ideas</p>
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
