"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Cluster, Stack } from "@acme/design-system/primitives";

type Lead = {
  id: string;
  source: string | null;
  sourceContext: string | null;
  title: string | null;
  url: string | null;
  priceBand: string | null;
  fingerprint: string | null;
  duplicateOf: string | null;
  status: string | null;
  triageScore: number | null;
  triageBand: string | null;
  triageReasons: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type LeadStrings = {
  intakeLabel: string;
  intakeTitle: string;
  runStagePLabel: string;
  promoteTopLabel: string;
  exportCsvLabel: string;
  leadLabel: string;
  urlLabel: string;
  submitLabel: string;
  table: {
    select: string;
    id: string;
    lead: string;
    source: string;
    triage: string;
    score: string;
    status: string;
  };
  notAvailable: string;
};

const PROMOTION_LIMIT = 5;

export default function LeadsClient({ strings }: { strings: LeadStrings }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningStageP, setRunningStageP] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", url: "" });

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leads?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as { ok?: boolean; leads?: Lead[] };
      if (data.ok && Array.isArray(data.leads)) {
        setLeads(data.leads);
        const allowed = new Set(data.leads.map((lead) => lead.id));
        setSelectedIds((current) =>
          current.filter((id) => allowed.has(id)),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const eligibleLeadIds = useMemo(
    () =>
      leads
        .filter(
          (lead) => lead.status === "NEW" || lead.status === "ON_HOLD",
        )
        .map((lead) => lead.id),
    [leads],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    leads.length > 0 && leads.every((lead) => selectedSet.has(lead.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      if (leads.length === 0) return current;
      const allIds = leads.map((lead) => lead.id);
      const isAllSelected = allIds.every((id) => current.includes(id));
      return isAllSelected ? [] : allIds;
    });
  }, [leads]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((existing) => existing !== id);
      }
      return [...current, id];
    });
  }, []);

  const exportUrl = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const params = new URLSearchParams();
    params.set("ids", selectedIds.join(","));
    return `/api/exports/leads?${params.toString()}`;
  }, [selectedIds]);

  const handleExport = useCallback(() => {
    if (!exportUrl) return;
    window.location.assign(exportUrl);
  }, [exportUrl]);

  const runStageP = useCallback(
    async (promotionLimit?: number) => {
      if (eligibleLeadIds.length === 0) return;
      setRunningStageP(true);
      try {
        await fetch("/api/stages/p/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadIds: eligibleLeadIds,
            promotionLimit,
          }),
        });
      } catch (error) {
        console.error(error);
      } finally {
        setRunningStageP(false);
        await loadLeads();
      }
    },
    [eligibleLeadIds, loadLeads],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const title = form.title.trim();
      const url = form.url.trim();
      if (!title && !url) return;

      setSubmitting(true);
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "manual",
            title: title || undefined,
            url: url || undefined,
          }),
        });
        setForm({ title: "", url: "" });
        await loadLeads();
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitting(false);
      }
    },
    [form.title, form.url, loadLeads],
  );

  return (
    <section className="pp-card p-6">
      <Cluster justify="between" alignY="center" className="gap-4">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.intakeLabel}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {strings.intakeTitle}
          </h2>
        </Stack>
        <Cluster gap={2} alignY="center">
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void runStageP()}
            disabled={runningStageP || eligibleLeadIds.length === 0}
            type="button"
          >
            {strings.runStagePLabel}
          </button>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void runStageP(PROMOTION_LIMIT)}
            disabled={runningStageP || eligibleLeadIds.length === 0}
            type="button"
          >
            {strings.promoteTopLabel}
          </button>
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleExport}
            disabled={!exportUrl}
            type="button"
          >
            {strings.exportCsvLabel}
          </button>
        </Cluster>
      </Cluster>

      <form
        className="mt-6 grid gap-4 md:grid-cols-3"
        onSubmit={handleSubmit}
      >
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.leadLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            disabled={submitting}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.urlLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.url}
            onChange={(event) =>
              setForm((current) => ({ ...current, url: event.target.value }))
            }
            disabled={submitting}
            type="url"
          />
        </label>
        <button
          className="min-h-12 min-w-12 self-end rounded-full border border-border-2 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {strings.submitLabel}
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border-1">
        <table className="pp-table" aria-busy={loading}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label={strings.table.select}
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>{strings.table.id}</th>
              <th>{strings.table.lead}</th>
              <th>{strings.table.source}</th>
              <th>{strings.table.triage}</th>
              <th>{strings.table.score}</th>
              <th>{strings.table.status}</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="py-4">
                      <div className="h-3 w-3 rounded-full bg-foreground/10" />
                    </td>
                    <td className="py-4">
                      <div className="h-3 w-16 rounded-full bg-foreground/10" />
                    </td>
                    <td>
                      <div className="h-3 w-40 rounded-full bg-foreground/10" />
                    </td>
                    <td>
                      <div className="h-3 w-24 rounded-full bg-foreground/10" />
                    </td>
                    <td>
                      <div className="h-6 w-16 rounded-full bg-foreground/10" />
                    </td>
                    <td>
                      <div className="h-3 w-10 rounded-full bg-foreground/10" />
                    </td>
                    <td>
                      <div className="h-3 w-16 rounded-full bg-foreground/10" />
                    </td>
                  </tr>
                ))
              : leads.map((lead) => {
                  const displayTitle =
                    lead.title ?? lead.url ?? strings.notAvailable;
                  const displaySource =
                    lead.source ?? lead.sourceContext ?? strings.notAvailable;
                  const displayScore =
                    lead.triageScore ?? strings.notAvailable;
                  const displayBand = lead.triageBand
                    ? lead.triageBand.toUpperCase()
                    : strings.notAvailable;
                  const displayStatus = lead.status ?? strings.notAvailable;

                  return (
                    <tr key={lead.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`${strings.table.select} ${strings.table.lead}`}
                          checked={selectedSet.has(lead.id)}
                          onChange={() => toggleSelected(lead.id)}
                        />
                      </td>
                      <td className="font-mono text-xs text-foreground/70">
                        {lead.id}
                      </td>
                      <td className="font-semibold">{displayTitle}</td>
                      <td className="text-sm text-foreground/70">
                        {displaySource}
                      </td>
                      <td>
                        <span className="rounded-full border border-border-2 px-2 py-1 text-xs">
                          {displayBand}
                        </span>
                      </td>
                      <td className="font-semibold">{displayScore}</td>
                      <td>
                        <span className="text-xs text-foreground/60">
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
