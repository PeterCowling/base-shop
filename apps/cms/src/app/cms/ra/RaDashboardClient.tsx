"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n";
import type { ReturnAuthorization } from "@acme/types";
import { Alert, Tag } from "@acme/ui/components/atoms";
import { Grid } from "@acme/ui/components/atoms/primitives/Grid";
import { Stack } from "@acme/ui/components/atoms/primitives/Stack";
import { Sidebar } from "@acme/ui/components/atoms/primitives/Sidebar";
import {
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import { cn } from "@acme/ui/utils/style";
import Link from "next/link";

export interface RaDashboardProps {
  ras: ReturnAuthorization[];
  error?: string | null;
}

type QuickFilterKey = "all" | "pending" | "resolved" | "highRisk";

interface QuickFilter {
  key: QuickFilterKey;
  test: (ra: ReturnAuthorization) => boolean;
}

const quickFilters: QuickFilter[] = [
  {
    key: "all",
    test: () => true,
  },
  {
    key: "pending",
    test: (ra) => /pending|open|awaiting/i.test(ra.status),
  },
  {
    key: "resolved",
    test: (ra) => /approved|completed|closed|refunded/i.test(ra.status),
  },
  {
    key: "highRisk",
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
  const t = useTranslations();
  const [activeFilter, setActiveFilter] = useState<QuickFilterKey>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const metrics = useMemo(() => {
    const pending = ras.filter(quickFilters.find((f) => f.key === "pending")!.test)
      .length;
    const resolved = ras.filter(quickFilters.find((f) => f.key === "resolved")!.test)
      .length;
    const highRisk = ras.filter((ra) => classifyRisk(ra) === "high").length;
    return [
      { label: t("cms.ra.metrics.activeQueue.label"), value: pending, caption: t("cms.ra.metrics.activeQueue.caption") },
      { label: t("cms.ra.metrics.resolved.label"), value: resolved, caption: t("cms.ra.metrics.resolved.caption") },
      { label: t("cms.ra.metrics.highRisk.label"), value: highRisk, caption: t("cms.ra.metrics.highRisk.caption") },
      { label: t("cms.ra.metrics.total.label"), value: ras.length, caption: t("cms.ra.metrics.total.caption") },
    ];
  }, [ras, t]);

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
      <Alert variant="danger" tone="soft" heading={String(t("cms.ra.error.loadFailed.heading"))}>
        <p className="text-sm">{error}</p>
        <p className="text-xs">{t("cms.ra.error.loadFailed.retryAdvice")}</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <header className="space-y-3">
        <Tag variant="default" className="bg-primary-soft text-foreground">
          {t("cms.ra.tag.title")}
        </Tag>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h2 className="text-2xl font-semibold">{t("cms.ra.heading")}</h2>
            <p className="text-sm text-muted-foreground">{t("cms.ra.subheading")}</p>
          </div>
        </div>
      </header>

      <section>
        <Grid cols={1} gap={4} className="sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card
              key={String(metric.label)}
              className="border border-border-1 bg-surface-2"
            >
              <CardContent className="space-y-1 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </p>
                <p className="text-2xl font-semibold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.caption}</p>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </section>

      <section>
        <Sidebar sideWidth="w-72" gap={5} className="lg:items-start">
          <Card className="border border-border-1 bg-surface-2">
            <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{t("cms.ra.quick.title")}</h3>
              <p className="text-xs text-muted-foreground">{t("cms.ra.quick.description")}</p>
            </div>
            <Stack gap={2}>
              {quickFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={activeFilter === filter.key}
                  className={cn(
                    "rounded-xl",
                    "border",
                    "px-3",
                    "py-2",
                    "text-left",
                    "text-sm",
                    "transition",
                    activeFilter === filter.key
                      ? ["border-primary/60", "bg-primary-soft", "text-foreground"]
                      : [
                          "border-border-2",
                          "bg-surface-2",
                          "text-muted-foreground",
                          "hover:border-primary/50",
                          "hover:bg-primary-soft",
                        ]
                  )}
                >
                  <span className="block font-semibold">{t(`cms.ra.quick.${filter.key}.label`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`cms.ra.quick.${filter.key}.desc`)}</span>
                </button>
              ))}
            </Stack>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cms.ra.search.label")}
              </label>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("cms.ra.search.placeholder") as string}
                className="border-border-2 bg-surface-2 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
          </Card>

          <Card className="border border-border-1 bg-surface-2">
            <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h3 className="text-lg font-semibold">{t("cms.ra.queue.title")}</h3>
                <p className="text-xs text-muted-foreground">{t("cms.ra.queue.description")}</p>
              </div>
              <Tag className="shrink-0" variant="default">
                {t("cms.ra.queue.showing", { count: filtered.length })}
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
              {t("cms.ra.queue.live", { shown: filtered.length, total: ras.length })}
            </div>
            <Stack gap={3}>
              {filtered.map((ra) => {
                const risk = classifyRisk(ra);
                return (
                  <Card
                    key={ra.raId}
                    data-testid="ra-card"
                    data-cy="ra-card"
                  className={cn(
                    "border",
                    "border-border-1",
                    "bg-surface-2",
                    "text-foreground",
                    risk === "high" && "border-danger/40",
                    risk === "medium" && "border-warning/40"
                  )}
                >
                    <CardContent className="space-y-3 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold">{t("cms.ra.card.raId", { id: ra.raId })}</p>
                        <p className="text-xs text-muted-foreground">{t("cms.ra.card.orderId", { id: ra.orderId })}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Tag variant={statusVariant(ra.status)}>{ra.status}</Tag>
                        <Tag variant={riskVariant(risk)}>
                          {t("cms.ra.card.risk", { level: t(`cms.ra.risk.${risk}`) })}
                        </Tag>
                      </div>
                    </div>
                    {ra.inspectionNotes && (
                      <p className="text-sm text-muted-foreground">{ra.inspectionNotes}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        asChild
                        className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <Link href={`/cms/orders/${ra.orderId}`}>{t("cms.ra.actions.viewOrder")}</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg border-border-2 bg-surface-2 text-sm text-foreground hover:bg-surface-3"
                      >
                        {t("cms.ra.actions.markFollowUp")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <Card className="border border-border-1 bg-surface-2 text-foreground">
                <CardContent className="space-y-3 px-6 py-6 text-center text-sm text-muted-foreground">
                  <Tag variant="warning">{t("cms.ra.empty.tagLabel")}</Tag>
                  <p>{t("cms.ra.empty.suggestion")}</p>
                </CardContent>
              </Card>
            )}
            </Stack>
            </CardContent>
          </Card>
        </Sidebar>
      </section>
    </div>
  );
}

export default RaDashboard;
