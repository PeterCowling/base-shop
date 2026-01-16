"use client";

import { Stack } from "@acme/ui/components/atoms/primitives";
import type { CandidateDetail, CandidateDetailStrings } from "./types";

export default function LeadDetailCard({
  candidate,
  strings,
}: {
  candidate: CandidateDetail | null;
  strings: CandidateDetailStrings;
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.lead.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.lead.title}
        </h2>
      </Stack>
      <Stack gap={3} className="mt-4 text-sm">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.leadTitle}
          </span>
          <div className="text-sm font-semibold">
            {candidate?.lead?.title ?? strings.notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.leadSource}
          </span>
          <div className="text-sm font-semibold">
            {candidate?.lead?.source ?? strings.notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.leadUrl}
          </span>
          <div className="text-sm font-semibold break-all">
            {candidate?.lead?.url ?? strings.notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.leadStatus}
          </span>
          <div className="text-sm font-semibold">
            {candidate?.lead?.status ?? strings.notAvailable}
          </div>
        </div>
      </Stack>
    </section>
  );
}
