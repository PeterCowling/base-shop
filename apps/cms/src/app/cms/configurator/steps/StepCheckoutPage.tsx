"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Tag } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";
import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";

import TemplateSelector from "../components/TemplateSelector";
import { ConfiguratorContext } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { apiRequest } from "../lib/api";

interface TemplateOption {
  id: string;
  name: string;
  components: PageComponent[];
  preview?: string | null;
  description?: string;
  category?: string;
  pageType?: string;
}

interface CheckoutPageSummary {
  id: string;
  slug: string;
  status: "draft" | "published";
  updatedAt: string;
  templateId?: string;
  previewPath: string;
  draftPreviewPath: string;
}

interface Props {
  pageTemplates?: Array<TemplateOption | { id?: string; name: string; components: PageComponent[]; preview?: string | null; description?: string; category?: string; pageType?: string }>;
  checkoutLayout?: string;
  setCheckoutLayout?: (v: string) => void;
  checkoutComponents?: PageComponent[];
  setCheckoutComponents?: (v: PageComponent[]) => void;
  checkoutPageId?: string | null;
  setCheckoutPageId?: (v: string | null) => void;
  shopId?: string;
  themeStyle?: React.CSSProperties;
  prevStepId?: string;
  nextStepId?: string;
}

function RequirementRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`h-2 w-2 rounded-full ${ok ? "bg-primary" : "bg-border"}`}
        aria-hidden
      />
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

export default function StepCheckoutPage({
  pageTemplates,
  checkoutLayout,
  setCheckoutLayout,
  checkoutComponents: _checkoutComponents,
  setCheckoutComponents: _setCheckoutComponents,
  checkoutPageId,
  setCheckoutPageId,
  shopId,
  themeStyle, // unused, kept for parity with other steps
  prevStepId,
  nextStepId,
}: Props): React.JSX.Element {
  void themeStyle;
  const t = useTranslations();
  const configurator = useContext(ConfiguratorContext);
  const state = configurator?.state;
  const update = configurator?.update;
  const templates = useMemo(() => {
    if (!Array.isArray(pageTemplates)) return [] as TemplateOption[];
    return pageTemplates.map((tpl) => ({
      ...tpl,
      id: (tpl as TemplateOption).id ?? tpl.name,
      preview: (tpl as TemplateOption).preview ?? (tpl as { previewImage?: string | null }).previewImage ?? null,
    })) as TemplateOption[];
  }, [pageTemplates]);

  const layout = checkoutLayout ?? state?.checkoutLayout ?? "";
  const setLayout = useMemo(
    () =>
      setCheckoutLayout ?? (update ? ((v: string) => update("checkoutLayout", v)) : undefined),
    [setCheckoutLayout, update],
  );
  const pageId = checkoutPageId ?? state?.checkoutPageId ?? null;
  const setPageId = useMemo(
    () =>
      setCheckoutPageId ??
      (update ? ((v: string | null) => update("checkoutPageId", v)) : undefined),
    [setCheckoutPageId, update],
  );
  const currentShopId = shopId ?? state?.shopId ?? "";
  const [pageSummary, setPageSummary] = useState<CheckoutPageSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [, markComplete] = useStepCompletion("checkout-page");
  const router = useRouter();

  const paymentComplete = state?.completed?.["payment-provider"] === "complete";
  const shippingComplete = state?.completed?.shipping === "complete";
  const hasTemplate = layout.trim().length > 0;
  const hasCheckoutPage = Boolean(pageId ?? pageSummary?.id);
  const isPublished = pageSummary?.status === "published";
  const canComplete = hasTemplate && hasCheckoutPage && paymentComplete && shippingComplete && isPublished;

  const statusHint = !hasCheckoutPage
    ? t("cms.configurator.checkoutPage.missing")
    : !isPublished
      ? t("cms.configurator.checkoutPage.unpublished")
      : null;

  useEffect(() => {
    if (!currentShopId) return;
    apiRequest<CheckoutPageSummary>(`/cms/api/checkout-page/${currentShopId}`)
      .then(({ data }) => {
        if (data) {
          setPageSummary(data);
          setPageId?.(data.id);
          if (!hasTemplate && data.templateId) {
            setLayout?.(data.templateId);
          }
        }
      })
      .catch(() => {
        /* noop */
      });
  }, [currentShopId, hasTemplate, setLayout, setPageId]);

  const ensureCheckoutPage = useCallback(
    async (templateId?: string) => {
      if (!currentShopId) {
        setError("Missing shop id"); // i18n-exempt -- developer-only guard
        return null;
      }
      setBusy(true);
      setError(null);
      const { data, error } = await apiRequest<CheckoutPageSummary>(
        `/cms/api/checkout-page/${currentShopId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: templateId ?? layout }),
        },
      );
      setBusy(false);
      if (data) {
        setPageSummary(data);
        setPageId?.(data.id);
        if (!hasTemplate && data.templateId) {
          setLayout?.(data.templateId);
        }
        setToast({ open: true, message: String(t("cms.configurator.shopPage.draftSaved")) });
        return data;
      }
      if (error) setError(error);
      return null;
    },
    [currentShopId, hasTemplate, layout, setLayout, setPageId, t],
  );

  const selectedTemplate = templates.find((tpl) => tpl.id === layout);
  const lastUpdated = (() => {
    const ts = pageSummary?.updatedAt;
    if (!ts) return null;
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return ts;
    return date.toLocaleString();
  })();

  const builderHref = pageSummary?.slug
    ? `/cms/shop/${currentShopId}/pages/${pageSummary.slug}/builder`
    : pageId
      ? `/cms/shop/${currentShopId}/pages/${pageId}/builder`
      : null;

  const previewHref = pageSummary?.draftPreviewPath ?? "/checkout?preview=draft";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t("cms.configurator.checkoutPage.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {/* i18n-exempt -- CMS checkout helper copy [ttl=2026-12-31] */}
            Choose the checkout template, then edit the layout in Page Builder.
          </p>
          {statusHint && (
            <p className="mt-1 text-xs text-warning-foreground">
              {statusHint}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Tag variant={pageSummary?.status === "published" ? "success" : "default"}>
            {pageSummary?.status === "published"
              ? t("cms.pages.status.published")
              : t("cms.pages.status.draft")}
          </Tag>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              {pageSummary?.status === "published"
                ? t("cms.builder.status.lastPublished", { date: lastUpdated })
                : t("cms.builder.status.lastSaved", { date: lastUpdated })}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-border/60 bg-surface-2 shadow-elevation-1">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t("cms.configurator.shopPage.selectTemplate")}
              </p>
              <TemplateSelector
                value={layout}
                pageTemplates={templates}
                allowBlank={false}
                triggerProps={{ "data-cy": "checkout-layout" }}
                onConfirm={(layoutName, comps, tpl) => {
                  setLayout?.(layoutName);
                  void ensureCheckoutPage(tpl.id);
                }}
              />
              {selectedTemplate?.description && (
                <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
              <p className="text-sm font-semibold text-foreground">Requirements</p>
              <ul className="mt-2 space-y-1">
                {/* i18n-exempt -- checklist labels [ttl=2026-12-31] */}
                <RequirementRow ok={hasTemplate} label="Template selected" />
                <RequirementRow ok={hasCheckoutPage} label="Checkout page saved" />
                <RequirementRow ok={isPublished} label="Checkout page published" />
                <RequirementRow ok={paymentComplete} label="Payment configured" />
                <RequirementRow ok={shippingComplete} label="Shipping configured" />
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-surface-2 shadow-elevation-1">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Checkout layout</p>
              <Inline alignY="center" gap={2}>
                <span className="text-sm text-muted-foreground">Template</span>
                <span className="text-sm font-semibold text-foreground">
                  {selectedTemplate?.name || t("cms.configurator.shopPage.blank")}
                </span>
              </Inline>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  {pageSummary?.status === "published"
                    ? t("cms.builder.status.lastPublished", { date: lastUpdated })
                    : t("cms.builder.status.lastSaved", { date: lastUpdated })}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                data-cy="edit-checkout-layout"
                onClick={async () => {
                  const summary = await ensureCheckoutPage(selectedTemplate?.id ?? layout);
                  if (summary?.slug) {
                    router.push(`/cms/shop/${currentShopId}/pages/${summary.slug}/builder`);
                  }
                }}
                disabled={!hasTemplate || busy || !currentShopId}
              >
                {pageSummary ? "Edit checkout layout" : "Create checkout page" /* i18n-exempt */}
              </Button>
              {builderHref && (
                <Button variant="outline" asChild>
                  <a href={builderHref} target="_blank" rel="noreferrer">
                    {t("cms.builder.preview.open")}
                  </a>
                </Button>
              )}
              <Button variant="ghost" asChild>
                <a href={previewHref} target="_blank" rel="noreferrer">
                  {t("cms.builder.preview.stage")}
                </a>
              </Button>
            </div>
            {error && <p className="text-sm text-danger-foreground">{error}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {/* i18n-exempt -- short status helper [ttl=2026-12-31] */}
          {canComplete ? "Ready to continue" : "Complete the checklist to continue"}
        </div>
        <div className="flex gap-3">
          {prevStepId && (
            <Button
              data-cy="back"
              variant="outline"
              onClick={() => router.push(`/cms/configurator/${prevStepId}`)}
            >
              {t("cms.back")}
            </Button>
          )}
          {nextStepId && (
            <Button
              data-cy="next"
              disabled={!canComplete}
              onClick={() => {
                markComplete(true);
                if (canComplete) {
                  router.push(`/cms/configurator/${nextStepId}`);
                }
              }}
            >
              {t("actions.next")}
            </Button>
          )}
          <Button
            data-cy="save-return"
            disabled={!canComplete}
            onClick={() => {
              markComplete(true);
              if (canComplete) {
                router.push(
                  "/cms/configurator", // i18n-exempt -- path
                );
              }
            }}
          >
            {t("cms.configurator.actions.saveReturn")}
          </Button>
        </div>
      </div>

      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}
