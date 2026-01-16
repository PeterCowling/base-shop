// apps/cms/src/app/cms/shop/[shop]/upgrade-preview/UpgradePreviewClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n";
import type { UpgradeComponent } from "@acme/types/upgrade";
import ComponentPreview from "@acme/ui/components/ComponentPreview";
import { Button, Card, CardContent, Skeleton } from "@acme/ui/components/atoms";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives";
import {
  CmsInlineHelpBanner,
  CmsLaunchChecklist,
  type CmsLaunchChecklistItem,
  type CmsLaunchStatus,
} from "@acme/ui/components/cms"; // UI: @acme/ui/components/cms/CmsInlineHelpBanner, CmsLaunchChecklist
import { z } from "zod";

interface Summary {
  updated: number;
  newComponents: number;
  total: number;
}

const schema = z.object({
  components: z
    .array(
      z.object({
        file: z.string(),
        componentName: z.string(),
        oldChecksum: z.string().optional(),
        newChecksum: z.string().optional(),
      })
    )
    .catch([]),
});

export default function UpgradePreviewClient({ shop }: { shop: string }) {
  const t = useTranslations();
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/${shop}/api/upgrade-changes`);

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = schema.parse(await res.json());
        if (!cancelled) {
          setChanges(data.components as UpgradeComponent[]);
        }
      } catch (err) {
        console.error("Failed to load upgrade changes", err); // i18n-exempt -- CMS-201 developer log; not user-facing copy [ttl=2026-03-31]
        if (!cancelled) {
          setError(String(t("cms.upgrade.loadError")));
          setChanges([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [shop, t]);

  const summary = useMemo<Summary>(() => {
    const updated = changes.filter((component) => component.oldChecksum).length;
    const newComponents = changes.filter((component) => !component.oldChecksum).length;
    return {
      updated,
      newComponents,
      total: changes.length,
    };
  }, [changes]);

  const emptyState = !loading && !error && summary.total === 0;

  const readinessChecklist = useMemo<CmsLaunchChecklistItem[]>(() => {
    const statusLabel = (status: CmsLaunchStatus): string => {
      if (status === "complete") {
        return String(t("cms.configurator.launchChecklist.status.complete"));
      }
      if (status === "error") {
        return String(t("cms.configurator.launchChecklist.status.error"));
      }
      if (status === "warning") {
        return String(t("cms.configurator.launchChecklist.status.warning"));
      }
      return String(t("cms.configurator.launchChecklist.status.pending"));
    };

    const items: CmsLaunchChecklistItem[] = [];

    const previewStatus: CmsLaunchStatus =
      loading ? "pending" : error ? "error" : "complete";
    items.push({
      id: "preview-loaded",
      label: String(t("cms.upgrade.readiness.previewLoaded")),
      status: previewStatus,
      statusLabel: statusLabel(previewStatus),
    });

    const hasChanges = summary.total > 0;
    const changesStatus: CmsLaunchStatus =
      loading ? "pending" : hasChanges ? "complete" : "warning";
    items.push({
      id: "changes-detected",
      label: String(t("cms.upgrade.readiness.hasChanges")),
      status: changesStatus,
      statusLabel: statusLabel(changesStatus),
    });

    const readyToPublishStatus: CmsLaunchStatus =
      loading || !!error
        ? "pending"
        : hasChanges
          ? "complete"
          : "warning";

    items.push({
      id: "ready-to-publish",
      label: String(t("cms.upgrade.readiness.readyToPublish")),
      status: readyToPublishStatus,
      statusLabel: statusLabel(readyToPublishStatus),
    });

    return items;
  }, [loading, error, summary.total, t]);

  const skeletons = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={`skeleton-${index}`}
          data-testid="upgrade-skeleton" /* i18n-exempt -- CMS-201 test id [ttl=2026-03-31] */
          data-cy="upgrade-skeleton" /* i18n-exempt -- CMS-201 test id [ttl=2026-03-31] */
          >
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      )),
    []
  );

  async function handlePublish() {
    setPublishing(true);
    setPublishMessage(null);
    try {
      const res = await fetch(`/api/shop/${shop}/republish`, {
        method: "POST",
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        if (typeof data === "object" && data && "error" in data) {
          const { error: errMsg } = data as { error?: unknown };
          if (typeof errMsg === "string" && errMsg.trim().length > 0) {
            throw new Error(errMsg);
          }
        }
        throw new Error(t("cms.upgrade.publish.error") as string);
      }

      setPublishMessage(t("cms.upgrade.publish.success") as string);
    } catch (err) {
      const fallback = t("cms.upgrade.publish.error") as string;
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : fallback;
      // i18n-exempt -- CMS-201 developer log; not user-facing copy [ttl=2026-03-31]
      console.error("Publish upgrade failed", err);
      setPublishMessage(message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <CmsInlineHelpBanner
        heading={String(t("cms.upgrade.summary.heading"))}
        body={String(t("cms.upgrade.prepare.desc"))}
        links={[
          {
            id: "upgrade-docs",
            label: String(t("cms.upgrade.viewSteps")),
            href: "/docs/upgrade-preview-republish.md",
          },
        ]}
      />
      <Card>
        <CardContent className="space-y-4 p-6">
          {loading ? (
            <div
              className="space-y-3"
              data-testid="summary-skeleton" /* i18n-exempt -- CMS-201 test id [ttl=2026-03-31] */
              data-cy="summary-skeleton" /* i18n-exempt -- CMS-201 test id [ttl=2026-03-31] */
            >
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : (
              <div className="space-y-4">
                <div>
                <h2 className="text-xl font-semibold">{t("cms.upgrade.summary.heading")}</h2>
                  <p className="text-muted-foreground text-sm">
                    {summary.total > 0
                    ? (summary.total === 1
                        ? t("cms.upgrade.summary.components.one", { count: summary.total })
                        : t("cms.upgrade.summary.components.other", { count: summary.total }))
                    : t("cms.upgrade.noUpdates")}
                  </p>
                </div>
                <CmsLaunchChecklist
                  heading={String(t("cms.upgrade.readiness.heading"))}
                  readyLabel={String(t("cms.upgrade.readiness.readyLabel"))}
                  showReadyCelebration
                  items={readinessChecklist}
                />
                {summary.total > 0 && (
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("cms.upgrade.metrics.updated")}
                      </dt>
                      <dd className="text-lg font-semibold">{summary.updated}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("cms.upgrade.metrics.new")}
                      </dt>
                      <dd className="text-lg font-semibold">{summary.newComponents}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("cms.upgrade.metrics.total")}
                      </dt>
                      <dd className="text-lg font-semibold">{summary.total}</dd>
                    </div>
                  </dl>
                )}
              </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {t("cms.upgrade.publish.cta")}
            </h2>
            {publishMessage ? (
              <p className="text-muted-foreground text-sm">{publishMessage}</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("cms.upgrade.prepare.desc")}
              </p>
            )}
          </div>
          <Button
            type="button"
            className="min-w-40"
            disabled={publishing || !!error}
            onClick={handlePublish}
          >
            {publishing
              ? (t("cms.upgrade.publish.loading") as string)
              : (t("cms.upgrade.publish.cta") as string)}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border border-destructive/40 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            {error} {t("cms.upgrade.tryAgain")}
          </CardContent>
        </Card>
      ) : null}

      <DSGrid cols={1} gap={4} className="" aria-busy={loading}>
        {loading
          ? skeletons
          : changes.map((component) => (
              <Card key={component.file}>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{component.componentName}</h3>
                    <p className="text-muted-foreground text-sm">{component.file}</p>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{t("cms.upgrade.checksum")}</span>{" "}
                      {component.oldChecksum ? (
                        <>
                          {component.oldChecksum} → <span>{component.newChecksum ?? "—"}</span>
                        </>
                      ) : (
                        <span>{component.newChecksum ?? "—"}</span>
                      )}
                    </div>
                  </div>
                  <ComponentPreview component={component} />
                </CardContent>
              </Card>
            ))}

        {emptyState ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground">
              {t("cms.upgrade.noChanges")}
            </CardContent>
          </Card>
        ) : null}
      </DSGrid>
    </div>
  );
}
