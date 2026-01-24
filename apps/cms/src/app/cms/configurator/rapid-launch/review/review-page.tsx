"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, Spinner, Tag } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";
import { Button } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Card, CardContent } from "@/components/atoms/shadcn";

import { useConfigurator } from "../../ConfiguratorContext";

import DerivedPagePreview from "./DerivedPagePreview";

type ReviewPayload = {
  shopId: string;
  storeName: string;
  locale: string;
  currency: string;
  themeId: string;
  brandKit: { logoUrl: string; faviconUrl: string; socialImageUrl: string };
  productIds: string[];
  paymentTemplateId: string;
  shippingTemplateId: string;
  taxTemplateId: string;
  legalBundleId: string;
  consentTemplateId: string;
  seo: { title: string; description: string };
  contactEmail?: string;
};

function extractLogo(logo: unknown): string {
  if (typeof logo === "string") return logo;
  if (!logo || typeof logo !== "object") return "";
  const record = logo as Record<string, string>;
  return record["desktop-landscape"] || Object.values(record)[0] || "";
}

function updateComponentTree(
  components: PageComponent[],
  targetId: string,
  updater: (component: PageComponent) => PageComponent,
): PageComponent[] {
  let changed = false;
  const next = components.map((component) => {
    let nextComponent = component;
    if (component.id === targetId) {
      const updated = updater(component);
      if (updated !== component) {
        nextComponent = updated;
        changed = true;
      }
    }
    const children = (component as { children?: PageComponent[] }).children;
    if (Array.isArray(children) && children.length > 0) {
      const nextChildren = updateComponentTree(children, targetId, updater);
      if (nextChildren !== children) {
        nextComponent = { ...nextComponent, children: nextChildren };
        changed = true;
      }
    }
    return nextComponent;
  });
  return changed ? next : components;
}

export default function ReviewPage(): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const { state, setState, update } = useConfigurator();

  const locale = state.locale ?? "en";
  const productIds = useMemo(
    () => state.rapidLaunchProductIds ?? [],
    [state.rapidLaunchProductIds]
  );
  const logoUrl = extractLogo(state.logo);

  const seoTitle = state.pageTitle?.[locale] ?? "";
  const seoDescription = state.pageDescription?.[locale] ?? "";

  const payload = useMemo<ReviewPayload | null>(() => {
    if (
      !state.shopId ||
      !state.storeName ||
      !state.theme ||
      !logoUrl ||
      !state.favicon ||
      !state.socialImage ||
      !state.paymentTemplateId ||
      !state.shippingTemplateId ||
      !state.taxTemplateId ||
      !state.legalBundleId ||
      !state.consentTemplateId
    ) {
      return null;
    }

    return {
      shopId: state.shopId,
      storeName: state.storeName,
      locale,
      currency: state.currency ?? "EUR",
      themeId: state.theme,
      brandKit: {
        logoUrl,
        faviconUrl: state.favicon,
        socialImageUrl: state.socialImage,
      },
      productIds,
      paymentTemplateId: state.paymentTemplateId,
      shippingTemplateId: state.shippingTemplateId,
      taxTemplateId: state.taxTemplateId,
      legalBundleId: state.legalBundleId,
      consentTemplateId: state.consentTemplateId,
      seo: {
        title: seoTitle,
        description: seoDescription,
      },
      contactEmail: state.contactInfo ?? undefined,
    };
  }, [
    state.shopId,
    state.storeName,
    state.theme,
    logoUrl,
    state.favicon,
    state.socialImage,
    state.paymentTemplateId,
    state.shippingTemplateId,
    state.taxTemplateId,
    state.legalBundleId,
    state.consentTemplateId,
    state.currency,
    locale,
    productIds,
    seoTitle,
    seoDescription,
    state.contactInfo,
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const review = state.rapidLaunchReview;
  const cachedHash = review?.inputHash;

  useEffect(() => {
    if (!payload) {
      setError(String(t("cms.rapidLaunch.review.missingRequired")));
      setLoading(false);
      return;
    }

    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/cms/api/rapid-launch/derive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, cachedHash }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to derive content");
        }

        if (json.status === "derived") {
          update("rapidLaunchReview", {
            inputHash: json.inputHash,
            derivedAt: json.derivedAt,
            derivationDurationMs: json.derivationDurationMs,
            warningCount: json.warningCount,
            pages: json.pages,
            navigation: json.navigation,
          });
        } else if (json.status === "not-modified" && !review) {
          throw new Error("No cached review data available.");
        }
      } catch (err) {
        if (active) {
          setError((err as Error).message || "Failed to derive content");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [payload, cachedHash, review, refreshKey, update, t]);

  useEffect(() => {
    if (!review?.pages?.length) return;
    if (!activeSlug || !review.pages.some((page) => page.slug === activeSlug)) {
      setActiveSlug(review.pages[0]?.slug ?? null);
    }
  }, [review?.pages, activeSlug]);

  const updateComponent = useCallback(
    (pageSlug: string, componentId: string, updater: (component: PageComponent) => PageComponent) => {
      setState((prev) => {
        const current = prev.rapidLaunchReview;
        if (!current) return prev;
        const pages = current.pages.map((page) => {
          if (page.slug !== pageSlug) return page;
          const nextComponents = updateComponentTree(page.components, componentId, updater);
          if (nextComponents === page.components) return page;
          return { ...page, components: nextComponents };
        });
        return { ...prev, rapidLaunchReview: { ...current, pages } };
      });
    },
    [setState],
  );

  const selectedPage = useMemo(() => {
    if (!review?.pages?.length) return null;
    return review.pages.find((page) => page.slug === activeSlug) ?? review.pages[0];
  }, [review?.pages, activeSlug]);

  const pageLabels = useMemo(
    () => ({
      home: t("cms.rapidLaunch.review.page.home"),
      category: t("cms.rapidLaunch.review.page.category"),
      product: t("cms.rapidLaunch.review.page.product"),
      about: t("cms.rapidLaunch.review.page.about"),
      contact: t("cms.rapidLaunch.review.page.contact"),
      faq: t("cms.rapidLaunch.review.page.faq"),
      "shipping-returns": t("cms.rapidLaunch.review.page.shipping"),
      terms: t("cms.rapidLaunch.review.page.terms"),
      privacy: t("cms.rapidLaunch.review.page.privacy"),
      accessibility: t("cms.rapidLaunch.review.page.accessibility"),
    }),
    [t],
  );

  const warningItems = useMemo(() => {
    const pages = review?.pages ?? [];
    return pages.flatMap((page) =>
      page.warnings.map((warning) => ({
        page,
        warning,
      })),
    );
  }, [review?.pages]);

  return (
    <div className="space-y-6">
      <Card className="border border-border-3 shadow-elevation-1">
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {t("cms.rapidLaunch.review.heading")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("cms.rapidLaunch.review.subheading")}
            </p>
          </div>

          {error && (
            <Alert
              variant="warning"
              tone="soft"
              heading={t("cms.rapidLaunch.review.errorHeading") as string}
            >
              <div className="text-sm text-muted-foreground">{error}</div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                >
                  {t("cms.rapidLaunch.review.retry")}
                </Button>
              </div>
            </Alert>
          )}

          {loading && !review ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-6">
              <Spinner className="h-5 w-5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {t("cms.rapidLaunch.review.loading")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("cms.rapidLaunch.review.loadingDetail")}
                </div>
              </div>
            </div>
          ) : null}

          {review ? (
            <Grid cols={1} gap={6} className="lg:grid-cols-12">
              <aside className="space-y-4 lg:col-span-4">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <div className="text-sm font-semibold">
                    {t("cms.rapidLaunch.review.pagesHeading")}
                  </div>
                  <div className="mt-3 space-y-2">
                    {review.pages.map((page) => {
                      const hasWarnings = page.warnings.length > 0;
                      const label =
                        page.type === "product"
                          ? page.seo.title?.split("|")[0]?.trim() ||
                            pageLabels.product
                          : pageLabels[page.type];
                      const isActive = page.slug === selectedPage?.slug;
                      return (
                        <button
                          key={page.slug}
                          type="button"
                          onClick={() => setActiveSlug(page.slug)}
                          className={`flex w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left transition ${
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{label}</span>
                            {hasWarnings ? (
                              <Tag variant="warning">
                                {t("cms.rapidLaunch.review.warningsCount", {
                                  count: String(page.warnings.length),
                                })}
                              </Tag>
                            ) : (
                              <span className="text-xs text-muted-foreground">✓</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {page.slug}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <div className="text-sm font-semibold">
                    {t("cms.rapidLaunch.review.navigationHeading")}
                  </div>
                  <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                    <div>
                      <div className="font-semibold text-foreground">
                        {t("cms.rapidLaunch.review.navigationHeader")}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {review.navigation.header.map((item) => (
                          <li key={item.url} className="flex items-center justify-between gap-2">
                            <span>{item.label}</span>
                            <span>{item.url}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {t("cms.rapidLaunch.review.navigationFooter")}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {review.navigation.footer.map((item) => (
                          <li key={item.url} className="flex items-center justify-between gap-2">
                            <span>{item.label}</span>
                            <span>{item.url}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="space-y-4 lg:col-span-8">
                {selectedPage ? (
                  <div className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {t("cms.rapidLaunch.review.previewHeading")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("cms.rapidLaunch.review.previewSlug")}: {selectedPage.slug}
                        </div>
                      </div>
                      {selectedPage.warnings.length > 0 && (
                        <Tag variant="warning">
                          {t("cms.rapidLaunch.review.warningsCount", {
                            count: String(selectedPage.warnings.length),
                          })}
                        </Tag>
                      )}
                    </div>
                    <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                      {t("cms.rapidLaunch.review.editHint")}
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                      <div>
                        <span className="font-semibold text-foreground">
                          {t("cms.rapidLaunch.review.previewSeoTitle")}:
                        </span>{" "}
                        {selectedPage.seo.title}
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold text-foreground">
                          {t("cms.rapidLaunch.review.previewSeoDescription")}:
                        </span>{" "}
                        {selectedPage.seo.description}
                      </div>
                    </div>
                    <DerivedPagePreview
                      page={selectedPage}
                      locale={locale}
                      onUpdateComponent={(componentId, updater) =>
                        updateComponent(selectedPage.slug, componentId, updater)
                      }
                    />
                  </div>
                ) : null}

                <details
                  className="rounded-xl border border-border/70 bg-muted/20 p-4"
                  open={warningItems.length > 0}
                >
                  <summary className="cursor-pointer text-sm font-semibold">
                    {t("cms.rapidLaunch.review.warningsHeading")}
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {warningItems.length === 0 ? (
                      <div>{t("cms.rapidLaunch.review.warningsEmpty")}</div>
                    ) : (
                      warningItems.map(({ page, warning }, idx) => (
                        <div key={`${page.slug}-${idx}`} className="rounded-md border border-border/60 p-2">
                          <div className="text-xs font-semibold text-foreground">
                            {page.type === "product"
                              ? page.seo.title?.split("|")[0]?.trim() ||
                                pageLabels.product
                              : pageLabels[page.type]}
                          </div>
                          <div className="text-xs text-muted-foreground">{warning}</div>
                        </div>
                      ))
                    )}
                  </div>
                </details>
              </section>
            </Grid>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/cms/configurator/rapid-launch/compliance")}
            >
              {t("cms.rapidLaunch.review.back")}
            </Button>
            <Button disabled>
              {t("cms.rapidLaunch.review.launchDisabled")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
