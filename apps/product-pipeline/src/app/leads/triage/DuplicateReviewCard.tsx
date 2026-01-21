"use client";

import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";

import type { DuplicateGroup, LeadTriageStrings } from "./types";

function formatScore(score: number | null, fallback: string): string {
  if (score === null || score === undefined) return fallback;
  return String(score);
}

export default function DuplicateReviewCard({
  groups,
  strings,
  onHoldGroup,
}: {
  groups: DuplicateGroup[];
  strings: LeadTriageStrings;
  onHoldGroup: (group: DuplicateGroup) => Promise<void>;
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.duplicate.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.duplicate.title}
        </h2>
      </Stack>
      <Stack gap={4} className="mt-4 text-sm">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-foreground/60">
            {strings.duplicate.empty}
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.fingerprint}
              className="rounded-3xl border border-border-1 bg-surface-2 p-4"
            >
              <Cluster justify="between" alignY="center" className="gap-4">
                <Stack gap={1}>
                  <span className="text-xs text-foreground/60">
                    {strings.duplicate.duplicateOf}: {group.fingerprint}
                  </span>
                  <span className="text-sm font-semibold">
                    {strings.duplicate.primary}: {group.primary.id}
                  </span>
                </Stack>
                <button
                  className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-border-2 px-4 py-2 text-xs font-semibold"
                  type="button"
                  onClick={() => void onHoldGroup(group)}
                >
                  {strings.duplicate.holdDuplicates}
                </button>
              </Cluster>
              <Stack gap={2} className="mt-4">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-border-1 bg-surface-1 px-3 py-2 text-xs"
                  >
                    <Cluster justify="between" alignY="center" className="gap-3">
                      <span className="font-semibold">
                        {member.id} - {member.title ?? member.url ?? strings.notAvailable}
                      </span>
                      <span className="text-foreground/60">
                        {strings.table.score}: {formatScore(member.triageScore, strings.notAvailable)}
                      </span>
                    </Cluster>
                  </div>
                ))}
              </Stack>
            </div>
          ))
        )}
      </Stack>
    </section>
  );
}
