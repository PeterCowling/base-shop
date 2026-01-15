"use client";

import type { LeadTriageStrings, LeadWithFingerprint } from "./types";

export default function LeadTriageTable({
  strings,
  leads,
  loading,
  selectedSet,
  allSelected,
  onToggleSelectAll,
  onToggleSelected,
  duplicateLookup,
}: {
  strings: LeadTriageStrings;
  leads: LeadWithFingerprint[];
  loading: boolean;
  selectedSet: Set<string>;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelected: (id: string) => void;
  duplicateLookup: Map<string, { primaryId: string; isPrimary: boolean }>;
}) {
  return (
    <section className="pp-card p-6">
      <div className="mb-4">
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.results.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.results.title}
        </h2>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border-1">
        <table className="pp-table min-w-max" aria-busy={loading}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label={strings.table.select}
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th>{strings.table.lead}</th>
              <th>{strings.table.source}</th>
              <th>{strings.table.context}</th>
              <th>{strings.table.triage}</th>
              <th>{strings.table.score}</th>
              <th>{strings.table.status}</th>
              <th>{strings.table.duplicate}</th>
              <th>{strings.table.reasons}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-sm text-foreground/60">
                  {strings.messages.loading}
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-sm text-foreground/60">
                  {strings.messages.empty}
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const title = lead.title ?? lead.url ?? strings.notAvailable;
                const source = lead.source ?? strings.notAvailable;
                const context = lead.sourceContext ?? strings.notAvailable;
                const triage = lead.triageBand
                  ? lead.triageBand.toUpperCase()
                  : strings.notAvailable;
                const score =
                  lead.triageScore !== null && lead.triageScore !== undefined
                    ? String(lead.triageScore)
                    : strings.notAvailable;
                const status = lead.status ?? strings.notAvailable;
                const reasons = lead.triageReasons?.join(", ") ?? strings.notAvailable;
                const dupInfo = duplicateLookup.get(lead.id);
                const duplicateLabel = dupInfo
                  ? dupInfo.isPrimary
                    ? strings.duplicate.primary
                    : `${strings.duplicate.duplicateOf} ${dupInfo.primaryId}`
                  : strings.notAvailable;

                return (
                  <tr key={lead.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={strings.table.select}
                        checked={selectedSet.has(lead.id)}
                        onChange={() => onToggleSelected(lead.id)}
                      />
                    </td>
                    <td className="font-semibold">{title}</td>
                    <td className="text-sm text-foreground/70">{source}</td>
                    <td className="text-sm text-foreground/70">{context}</td>
                    <td>
                      <span className="rounded-full border border-border-2 px-2 py-1 text-xs">
                        {triage}
                      </span>
                    </td>
                    <td className="font-semibold">{score}</td>
                    <td>
                      <span className="text-xs text-foreground/60">
                        {status}
                      </span>
                    </td>
                    <td className="text-xs text-foreground/60">
                      {duplicateLabel}
                    </td>
                    <td className="text-xs text-foreground/60">{reasons}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
