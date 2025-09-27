// apps/cms/src/app/cms/shop/[shop]/upgrade-preview/UpgradePreviewClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n";
import type { UpgradeComponent } from "@acme/types/upgrade";
import ComponentPreview from "@ui/components/ComponentPreview";
import { Card, CardContent, Skeleton } from "@ui/components/atoms";
import { Grid as DSGrid } from "@ui/components/atoms/primitives";
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
        console.error("Failed to load upgrade changes", err); // i18n-exempt: developer log; not user-facing copy
        if (!cancelled) {
          setError(t("We couldn't load the latest upgrade preview."));
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

  const skeletons = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={`skeleton-${index}`}
          data-testid="upgrade-skeleton" /* i18n-exempt: test id */
          data-cy="upgrade-skeleton" /* i18n-exempt: test id */
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          {loading ? (
            <div
              className="space-y-3"
              data-testid="summary-skeleton" /* i18n-exempt: test id */
              data-cy="summary-skeleton" /* i18n-exempt: test id */
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
                <h2 className="text-xl font-semibold">{t("Upgrade summary")}</h2>
                  <p className="text-muted-foreground text-sm">
                    {summary.total > 0
                    ? `${summary.total} ${t("component")}${summary.total === 1 ? "" : "s"} ${t("ready for review.")}`
                    : t("You're all caught up—no component updates detected.")}
                  </p>
                </div>
                {summary.total > 0 && (
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("Updated components")}
                      </dt>
                      <dd className="text-lg font-semibold">{summary.updated}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("New components")}
                      </dt>
                      <dd className="text-lg font-semibold">{summary.newComponents}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("Total changes")}
                      </dt>
                      <dd className="text-lg font-semibold">{summary.total}</dd>
                    </div>
                  </dl>
                )}
              </div>
          )}
        </CardContent>
      </Card>

      {error ? (
        <Card className="border border-destructive/40 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            {error} {t("Try again or refresh the page.")}
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
                      <span className="font-medium text-foreground">{t("Checksum:")}</span>{" "}
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
              {t("No changes to preview.")}
            </CardContent>
          </Card>
        ) : null}
      </DSGrid>
    </div>
  );
}
