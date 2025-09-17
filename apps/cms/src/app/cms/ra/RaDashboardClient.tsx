"use client";

import { useMemo, useState } from "react";
import type { ReturnAuthorization } from "@acme/types";
import { Tag } from "@acme/ui";
import {
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import { cn } from "@ui/utils/style";
import Link from "next/link";

export interface RaDashboardProps {
  ras: ReturnAuthorization[];
  error?: string | null;
}

type QuickFilterKey = "all" | "pending" | "resolved" | "highRisk";

interface QuickFilter {
  key: QuickFilterKey;
  label: string;
  description: string;
  test: (ra: ReturnAuthorization) => boolean;
}

const quickFilters: QuickFilter[] = [
  {
    key: "all",
    label: "All",
    description: "Every authorization",
    test: () => true,
  },
  {
    key: "pending",
    label: "Awaiting review",
    description: "Needs manual inspection",
    test: (ra) => /pending|open|awaiting/i.test(ra.status),
  },
  {
    key: "resolved",
    label: "Resolved",
    description: "Completed or refunded",
    test: (ra) => /approved|completed|closed|refunded/i.test(ra.status),
  },
  {
    key: "highRisk",
    label: "High risk",
    description: "Escalate immediately",
    test: (ra) => classifyRisk(ra) === "high",
  },
];

type RiskLevel = "high" | "medium" | "low";

function classifyRisk(ra: ReturnAuthorization): RiskLevel {
  const note = ra.inspectionNotes?.toLowerCase() ?? "";
  const status = ra.status.toLowerCase();
  if (/(fraud|chargeback|damage|broken|escalated)/.test(note) || /fraud|escalated/.test(status)) {
    return "high";
  }
  if (/(manual|verify|awaiting|inspection)/.test(note) || /pending|hold|review/.test(status)) {
    return "medium";
  }
  return "low";
}

function statusVariant(status: string): "default" | "success" | "warning" | "destructive" {
  const normalized = status.toLowerCase();
  if (/approved|completed|closed|resolved/.test(normalized)) return "success";
  if (/pending|awaiting|hold|review/.test(normalized)) return "warning";
  if (/rejected|fraud|cancelled|denied/.test(normalized)) return "destructive";
  return "default";
}

function riskVariant(level: RiskLevel): "default" | "warning" | "destructive" | "success" {
  if (level === "high") return "destructive";
  if (level === "medium") return "warning";
  return "success";
}

export function RaDashboard({ ras, error }: RaDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<QuickFilterKey>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const metrics = useMemo(() => {
    const pending = ras.filter(quickFilters.find((f) => f.key === "pending")!.test)
      .length;
    const resolved = ras.filter(quickFilters.find((f) => f.key === "resolved")!.test)
      .length;
    const highRisk = ras.filter((ra) => classifyRisk(ra) === "high").length;
    return [
      { label: "Active queue", value: pending, caption: "Awaiting attention" },
      { label: "Resolved", value: resolved, caption: "Closed authorizations" },
      { label: "High risk", value: highRisk, caption: "Escalations to triage" },
      { label: "Total", value: ras.length, caption: "Records in system" },
    ];
  }, [ras]);

  const filtered = useMemo(() => {
    const quick = quickFilters.find((filter) => filter.key === activeFilter) ?? quickFilters[0];
    return ras.filter((ra) => {
      const matchesQuick = quick.test(ra);
      if (!matchesQuick) return false;
      if (!searchTerm.trim()) return true;
      const query = searchTerm.trim().toLowerCase();
      return (
        ra.raId.toLowerCase().includes(query) ||
        ra.orderId.toLowerCase().includes(query) ||
        (ra.inspectionNotes ?? "").toLowerCase().includes(query)
      );
    });
  }, [ras, activeFilter, searchTerm]);

  if (error) {
    return (
      <Card className="border border-rose-500/30 bg-rose-500/10 text-white">
        <CardContent className="space-y-3 px-6 py-6">
          <Tag variant="destructive" className="bg-rose-500/40 text-white">
            Unable to load return authorizations
          </Tag>
          <p className="text-sm text-white/80">{error}</p>
          <p className="text-xs text-white/60">
            Retry shortly or verify the data source connection for the RA service.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <header className="space-y-3">
        <Tag variant="default" className="bg-indigo-500/20 text-indigo-200">
          Return authorizations
        </Tag>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">RA workflow overview</h2>
            <p className="text-sm text-white/70">
              Quickly identify escalations, filter by status, and move authorizations forward.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="border border-white/10 bg-slate-900/70"
          >
            <CardContent className="space-y-1 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-white/60">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold">{metric.value}</p>
              <p className="text-xs text-white/60">{metric.caption}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[300px,1fr]">
        <Card className="border border-white/10 bg-slate-900/60">
          <CardContent className="space-y-4 px-5 py-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Quick filters</h3>
              <p className="text-xs text-white/70">
                Snap to a subset and broadcast the count in the live region below.
              </p>
            </div>
            <div className="grid gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={activeFilter === filter.key}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition",
                    activeFilter === filter.key
                      ? "border-indigo-400 bg-indigo-500/20 text-white"
                      : "border-white/20 bg-white/5 text-white/80 hover:border-indigo-300 hover:bg-indigo-500/10"
                  )}
                >
                  <span className="block font-semibold">{filter.label}</span>
                  <span className="block text-xs text-white/60">{filter.description}</span>
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Search
              </label>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Filter by RA, order, or note"
                className="border-white/20 bg-white/5 text-white placeholder:text-white/50"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60">
          <CardContent className="space-y-4 px-5 py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Authorization queue</h3>
                <p className="text-xs text-white/60">
                  Actions provide suggested follow-ups so teams can unblock customers quickly.
                </p>
              </div>
              <Tag variant="default" className="bg-white/10 text-white/70">
                {filtered.length} showing
              </Tag>
            </div>
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              data-testid="ra-announce"
              data-cy="ra-announce"
              className="sr-only"
            >
              Showing {filtered.length} of {ras.length} return authorizations
            </div>
            <div className="grid gap-3">
              {filtered.map((ra) => {
                const risk = classifyRisk(ra);
                return (
                  <Card
                    key={ra.raId}
                    data-testid="ra-card"
                    data-cy="ra-card"
                    className={cn(
                      "border border-white/10 bg-white/5 text-white",
                      risk === "high" && "border-rose-400/40 bg-rose-500/10",
                      risk === "medium" && "border-amber-400/40 bg-amber-500/10"
                    )}
                  >
                    <CardContent className="space-y-3 px-5 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">RA {ra.raId}</p>
                          <p className="text-xs text-white/70">Order {ra.orderId}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant={statusVariant(ra.status)}>{ra.status}</Tag>
                          <Tag variant={riskVariant(risk)}>Risk: {risk}</Tag>
                        </div>
                      </div>
                      {ra.inspectionNotes && (
                        <p className="text-sm text-white/70">{ra.inspectionNotes}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <Button
                          asChild
                          className="h-9 rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-400"
                        >
                          <Link href={`/cms/orders/${ra.orderId}`}>View order</Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-lg border-white/30 bg-white/10 text-sm text-white hover:bg-white/20"
                        >
                          Mark for follow-up
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <Card className="border border-white/10 bg-white/5 text-white">
                  <CardContent className="space-y-3 px-6 py-6 text-center text-sm text-white/70">
                    <Tag variant="warning" className="bg-amber-500/20 text-amber-100">
                      No matches
                    </Tag>
                    <p>
                      Try clearing filters or widening your search to surface more return authorizations.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default RaDashboard;
