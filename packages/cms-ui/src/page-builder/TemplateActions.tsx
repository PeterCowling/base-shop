"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { Grid } from "@acme/design-system/primitives/Grid";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import { diffPage, type TemplateDescriptor } from "@acme/page-builder-core";
import type { Page } from "@acme/types";

let telemetryTrack: (name: string, payload?: Record<string, unknown>) => void = () => {};
// Optional telemetry hook; noop when unavailable (storybook/tests).
void import("@acme/telemetry")
  .then((mod) => {
    telemetryTrack = mod.track;
  })
  .catch(() => {});

interface TemplateActionsProps {
  templates?: TemplateDescriptor[];
  currentPage: Page;
  buildTemplatePage: (template: TemplateDescriptor) => Page;
  onApply: (template: TemplateDescriptor, nextPage: Page) => Promise<void> | void;
}

interface PreviewState {
  template: TemplateDescriptor;
  nextPage: Page;
  diffKeys: string[];
  beforeCount: number;
  afterCount: number;
}

export default function TemplateActions({
  templates,
  currentPage,
  buildTemplatePage,
  onApply,
}: TemplateActionsProps): React.JSX.Element | null {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [applying, setApplying] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<TemplateDescriptor["kind"] | "all">("all");
  const [filterCategory, setFilterCategory] = useState<TemplateDescriptor["category"] | "all">("all");
  const [filterPageType, setFilterPageType] = useState<NonNullable<TemplateDescriptor["pageType"]> | "all">("all");
  const catalog = useMemo<TemplateDescriptor[]>(
    () => (Array.isArray(templates) ? templates : []),
    [templates],
  );
  const selectedTemplate = useMemo(() => {
    const first = catalog.length > 0 ? catalog[0] : null;
    if (!selectedId) return first;
    return catalog.find((tpl) => tpl.id === selectedId) ?? first;
  }, [catalog, selectedId]);
  const isEmpty = (currentPage.components?.length ?? 0) === 0;
  const pageId = currentPage.id;
  const pageStableId = (currentPage as { stableId?: string }).stableId;
  const slotFragmentKind = "slot-fragment" as TemplateDescriptor["kind"]; // i18n-exempt -- DS-3472 template kind identifier, not UI copy [ttl=2026-12-31]
  const templateActionsTriggerCy = "template-actions-trigger"; // i18n-exempt -- DS-3472 test id hook, not user copy [ttl=2026-12-31]
  const templateCardBase =
    "relative flex flex-col rounded-lg border border-border/60 bg-surface-1 text-start shadow-sm transition hover:shadow-md min-h-10 min-w-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"; // i18n-exempt -- DS-3472 style tokens for card layout, not user copy [ttl=2026-12-31]
  const templateCardSelected = "border-primary shadow-md"; // i18n-exempt -- DS-3472 selected card styling, not user copy [ttl=2026-12-31]

  useEffect(() => {
    if (open) {
      telemetryTrack("pb_template_gallery_open", {
        surface: "page-builder",
        pageId,
        pageStableId,
        count: catalog.length,
      });
    }
  }, [open, catalog.length, pageId, pageStableId]);

  useEffect(() => {
    if (!selectedTemplate) {
      setPreview(null);
      return;
    }
    try {
      const nextPage = buildTemplatePage(selectedTemplate);
      const diff = diffPage(currentPage, nextPage);
      setPreview({
        template: selectedTemplate,
        nextPage,
        diffKeys: Object.keys(diff),
        beforeCount: currentPage.components?.length ?? 0,
        afterCount: nextPage.components?.length ?? 0,
      });
    } catch {
      setPreview(null);
    }
  }, [selectedTemplate, currentPage, buildTemplatePage]);

  const label = isEmpty ? t("cms.builder.templates.create") : t("cms.builder.templates.swap");
  const galleryTitle = t("cms.builder.templates.gallery.title");

  const apply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      telemetryTrack("pb_template_apply", {
        templateId: preview.template.id,
        kind: preview.template.kind,
        category: preview.template.category,
        pageType: preview.template.pageType,
        origin: preview.template.origin,
        pageId: currentPage.id,
      });
      await onApply(preview.template, preview.nextPage);
      setOpen(false);
    } finally {
      setApplying(false);
    }
  };

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((tpl) => tpl.category))).sort(),
    [catalog],
  );

  const pageTypes = useMemo(
    () =>
      Array.from(
        new Set(
          catalog
            .map((tpl) => tpl.pageType)
            .filter(Boolean) as NonNullable<TemplateDescriptor["pageType"]>[],
        ),
      ).sort(),
    [catalog],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((tpl) => {
      if (filterKind !== "all" && tpl.kind !== filterKind) return false;
      if (filterCategory !== "all" && tpl.category !== filterCategory) return false;
      if (filterPageType !== "all" && tpl.pageType !== filterPageType) return false;
      if (!query) return true;
      const haystack = `${tpl.label} ${tpl.description ?? ""} ${tpl.category} ${tpl.pageType ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [catalog, filterKind, filterCategory, filterPageType, search]);

  if (catalog.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-cy={templateActionsTriggerCy}
      >
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{galleryTitle}</DialogTitle>
            <DialogDescription>
              {t("cms.builder.templates.swapDescription")}
            </DialogDescription>
          </DialogHeader>
          <Stack gap={3}>
            <Inline gap={2}>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("cms.builder.templates.search")}
                aria-label={t("cms.builder.templates.searchLabel")}
                className="flex-1 min-w-56"
              />
              <Select
                value={filterKind}
                onValueChange={(v) => setFilterKind(v as typeof filterKind)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t("cms.builder.templates.kind")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("cms.builder.templates.kind.all")}</SelectItem>
                  <SelectItem value="page">{t("cms.builder.templates.kind.page")}</SelectItem>
                  <SelectItem value="section">{t("cms.builder.templates.kind.section")}</SelectItem>
                  <SelectItem value={slotFragmentKind}>
                    {t("cms.builder.templates.kind.slotFragment")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterCategory}
                onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("cms.builder.templates.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("cms.builder.presets.category.all")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pageTypes.length > 0 && (
                <Select
                  value={filterPageType}
                  onValueChange={(v) => setFilterPageType(v as typeof filterPageType)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("cms.builder.templates.usage")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("cms.builder.presets.category.all")}</SelectItem>
                    {pageTypes.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Inline>
            <Grid cols={1} gap={3} className="sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tpl) => {
                const isSelected = tpl.id === selectedTemplate?.id;
                const templateCardClass = `${templateCardBase}${isSelected ? ` ${templateCardSelected}` : ""}`;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    data-selected={isSelected ? "true" : undefined}
                    className={templateCardClass}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedId(tpl.id);
                      telemetryTrack("pb_template_select", {
                        templateId: tpl.id,
                        kind: tpl.kind,
                        category: tpl.category,
                        pageType: tpl.pageType,
                        origin: tpl.origin,
                        pageId: currentPage.id,
                      });
                    }}
                    data-cy={`template-${tpl.id}`}
                  >
                    {tpl.previewImage ? (
                      <Image
                        src={tpl.previewImage}
                        alt={`${tpl.label} preview`}
                        width={480}
                        height={320}
                        className="h-32 w-full rounded-t-lg object-cover"
                      />
                    ) : (
                      <Inline gap={0} alignY="center" wrap={false} className="h-32 w-full justify-center rounded-t-lg bg-muted text-xs text-muted-foreground">
                        {t("cms.builder.templates.noPreview")}
                      </Inline>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                          {tpl.category}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                          {tpl.kind}
                        </span>
                        {tpl.pageType && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                            {tpl.pageType}
                          </span>
                        )}
                      </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{tpl.label}</p>
                      {tpl.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{tpl.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
              {filtered.length === 0 && (
                <div className="col-span-full rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
                  {t("cms.builder.templates.emptyFiltered")}
                </div>
              )}
            </Grid>
            {preview && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <Inline gap={3} alignY="start" className="flex-wrap">
                  {preview.template.previewImage && (
                    <Image
                      src={preview.template.previewImage}
                      alt={`${preview.template.label} preview`}
                      width={240}
                      height={160}
                      className="h-32 w-40 rounded object-cover"
                    />
                  )}
                  <Stack gap={2} className="min-w-60 text-sm">
                    <div>
                      <p className="font-semibold">{preview.template.label}</p>
                      {preview.template.description && (
                        <p className="text-muted-foreground">{preview.template.description}</p>
                      )}
                    </div>
                    <ul className="space-y-1">
                      <li>
                        {t("cms.builder.templates.blockDelta", {
                          from: String(preview.beforeCount),
                          to: String(preview.afterCount),
                        })}
                      </li>
                      <li>
                        {t("cms.builder.templates.changedFields", {
                          fields: preview.diffKeys.length
                            ? preview.diffKeys.join(", ")
                            : t("cms.builder.templates.noDiff"),
                        })}
                      </li>
                    </ul>
                  </Stack>
                </Inline>
              </div>
            )}
          </Stack>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={apply} disabled={!preview || applying}>
              {applying ? t("cms.builder.templates.applying") : t("cms.builder.templates.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
