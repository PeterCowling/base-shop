"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";
import { Grid, Inline, Stack } from "@ui/components/atoms/primitives";

interface Template {
  id: string;
  name: string;
  components: PageComponent[];
  preview?: string | null;
  description?: string;
  category?: string;
  pageType?: string;
  origin?: string;
  disabled?: boolean;
  kind?: "page" | "section" | "slot-fragment";
}

interface Props {
  /** Currently selected layout name */
  value: string;
  /** Available templates to choose from */
  pageTemplates?: Template[];
  /** Called with normalized layout name and components when confirmed */
  onConfirm: (layout: string, components: PageComponent[], template: Template) => void;
  /** Optional props for the SelectTrigger */
  triggerProps?: React.ComponentProps<typeof SelectTrigger> & {
    [key: `data-${string}`]: unknown;
  };
  /** Whether to show a blank option */
  allowBlank?: boolean;
}

/**
 * Reusable selector for choosing a page template. Encapsulates the Radix select
 * with a confirmation dialog and returns newly generated component ids.
 */
export default function TemplateSelector({
  value,
  pageTemplates,
  onConfirm,
  triggerProps,
  allowBlank = true,
}: Props): React.JSX.Element {
  const t = useTranslations();
  const tt = useCallback(
    (key: string, fallback: string) => {
      const val = t(key) as string;
      return val === key ? fallback : val;
    },
    [t],
  );
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(value || null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterKind, setFilterKind] = useState<string>("all");
  const templates = useMemo(
    () => (Array.isArray(pageTemplates) ? pageTemplates : []),
    [pageTemplates],
  );

  useEffect(() => {
    setSelectedId(value || null);
  }, [value]);

  useEffect(() => {
    if (open) {
      track("template_gallery_open", {
        surface: "configurator",
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        count: templates.length,
      });
    }
  }, [open, templates.length]);

  const resolvedTemplates = useMemo(() => {
    const base = allowBlank
      ? [
          {
            id: "blank",
            name: tt("cms.configurator.shopPage.blank", "Blank page"),
            components: [],
            preview: "",
            description: tt("cms.configurator.shopPage.blankDescription", "Start from an empty page"),
            category: "Blank",
            kind: "page",
          } satisfies Template,
          ...templates,
        ]
      : templates;
    return base;
  }, [allowBlank, templates, tt]);

  const selectedTemplate = useMemo(() => {
    const fallback = resolvedTemplates[0] ?? null;
    if (!selectedId) return fallback;
    return resolvedTemplates.find((tpl) => tpl.id === selectedId) ?? fallback;
  }, [resolvedTemplates, selectedId]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          resolvedTemplates
            .map((tpl) => tpl.category)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [resolvedTemplates],
  );

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resolvedTemplates.filter((tpl) => {
      if (filterCategory !== "all" && tpl.category !== filterCategory) return false;
      if (filterKind !== "all" && tpl.kind && filterKind !== tpl.kind) return false;
      if (!q) return true;
      const hay = `${tpl.name} ${tpl.description ?? ""} ${tpl.category ?? ""} ${tpl.pageType ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [resolvedTemplates, search, filterCategory, filterKind]);

  const { color: _triggerColor, ...buttonTriggerProps } = triggerProps ?? {};

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen(true)}
        {...buttonTriggerProps}
      >
        <span className="truncate">
          {selectedTemplate
            ? selectedTemplate.id === "blank"
              ? tt("cms.configurator.shopPage.blank", "Blank page")
              : selectedTemplate.name
            : tt("cms.configurator.shopPage.selectTemplate", "Select a template")}
        </span>
        <span aria-hidden>›</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tt("cms.configurator.shopPage.selectTemplate", "Select a template")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tt("cms.builder.templates.search", "Search templates")}
                aria-label={tt("cms.builder.templates.searchLabel", "Search templates")}
                className="w-56 flex-1"
              />
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={tt("cms.builder.templates.category", "Category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tt("cms.builder.presets.category.all", "All")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterKind} onValueChange={(v) => setFilterKind(v)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={tt("cms.builder.templates.kind", "Kind")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tt("cms.builder.presets.category.all", "All")}</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="slot-fragment">Slot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Grid cols={1} gap={3} className="sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplate?.id;
                const label =
                  tpl.id === "blank"
                    ? tt("cms.configurator.shopPage.blank", "Blank page")
                    : tpl.name;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    className={`relative flex flex-col rounded-lg border bg-surface-2 text-left shadow-sm transition hover:shadow-md ${isSelected ? "border-primary" : "border-border/60"}`}
                    onClick={() => setSelectedId(tpl.id)}
                    disabled={tpl.disabled}
                  >
                    {tpl.preview ? (
                      <Image
                        src={tpl.preview}
                        alt={String(t("cms.configurator.shopPage.previewAlt", { name: tpl.name }))}
                        width={480}
                        height={320}
                        className="h-32 w-full rounded-t-lg object-cover"
                      />
                    ) : (
                      <Inline
                        alignY="center"
                        className="h-32 w-full justify-center rounded-t-lg bg-muted text-xs text-muted-foreground"
                        wrap={false}
                      >
                        {tt("cms.builder.templates.noPreview", "Preview coming soon")}
                      </Inline>
                    )}
                    <Stack gap={2} className="flex-1 p-3">
                      <Inline gap={2} alignY="center" className="flex-wrap">
                        {tpl.category && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                            {tpl.category}
                          </span>
                        )}
                        {tpl.pageType && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                            {tpl.pageType}
                          </span>
                        )}
                      </Inline>
                      <p className="truncate text-sm font-semibold">{label}</p>
                      {tpl.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{tpl.description}</p>
                      )}
                    </Stack>
                  </button>
                );
              })}
              {filteredTemplates.length === 0 && (
                <div className="col-span-full rounded border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                  {tt("cms.builder.templates.emptyFiltered", "No templates match these filters.")}
                </div>
              )}
            </Grid>
            {selectedTemplate && (
              <div className="rounded border border-border/60 bg-surface-2 p-3 text-sm">
                <p className="font-semibold">
                  {selectedTemplate.id === "blank"
                    ? tt("cms.configurator.shopPage.blank", "Blank page")
                    : selectedTemplate.name}
                </p>
                {selectedTemplate.description && (
                  <p className="text-muted-foreground">{selectedTemplate.description}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!selectedTemplate || selectedTemplate.disabled) return;
                const layout = selectedTemplate.id === "blank" ? "" : selectedTemplate.id;
                const comps = selectedTemplate.components.map((c) => ({
                  ...c,
                  id: ulid(),
                }));
                track("template_select", {
                  surface: "configurator",
                  path: typeof window !== "undefined" ? window.location.pathname : undefined,
                  templateId: layout || "blank",
                  category: selectedTemplate.category,
                  pageType: selectedTemplate.pageType,
                  origin: selectedTemplate.origin,
                  kind: selectedTemplate.kind ?? "page",
                });
                onConfirm(layout, comps, selectedTemplate);
                setOpen(false);
              }}
            >
              {t("actions.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
