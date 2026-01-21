"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] XA filters use legacy patterns pending design/i18n overhaul */

import * as React from "react";

import { Button, Checkbox, Input } from "@acme/ui/components/atoms";
import { OverlayScrim } from "@acme/ui/components/atoms";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@acme/ui/components/atoms/primitives/drawer";
import { Grid as LayoutGrid } from "@acme/ui/atoms/Grid";

import {
  XA_COLOR_SWATCHES,
  formatLabel,
  getDesignerName,
  getTrendingDesigners,
} from "../lib/xaCatalog";
import type { FilterConfig, FilterKey } from "../lib/xaFilters";

const PRICE_PRESETS = [
  { label: "Under 100", min: 0, max: 100 },
  { label: "100-200", min: 100, max: 200 },
  { label: "200-400", min: 200, max: 400 },
  { label: "400+", min: 400, max: undefined },
];

type XaFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterConfigs: FilterConfig[];
  facetValues: Record<FilterKey, string[]>;
  draftValues: Record<FilterKey, Set<string>>;
  draftInStock: boolean;
  draftSale: boolean;
  draftNewIn: boolean;
  draftMin: string;
  draftMax: string;
  onToggleValue: (key: FilterKey, value: string) => void;
  onChangeInStock: (value: boolean) => void;
  onChangeSale: (value: boolean) => void;
  onChangeNewIn: (value: boolean) => void;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
  onClear: () => void;
  onApply: () => void;
};

export function XaFiltersDrawer({
  open,
  onOpenChange,
  filterConfigs,
  facetValues,
  draftValues,
  draftInStock,
  draftSale,
  draftNewIn,
  draftMin,
  draftMax,
  onToggleValue,
  onChangeInStock,
  onChangeSale,
  onChangeNewIn,
  onChangeMin,
  onChangeMax,
  onClear,
  onApply,
}: XaFiltersDrawerProps) {
  const [designerQuery, setDesignerQuery] = React.useState("");

  const designerOptions = (facetValues.designer ?? []).map((handle) => ({
    handle,
    name: getDesignerName(handle),
  }));
  const designerQueryLower = designerQuery.trim().toLowerCase();
  const filteredDesigners = designerQueryLower
    ? designerOptions.filter((designer) =>
        designer.name.toLowerCase().includes(designerQueryLower),
      )
    : designerOptions;
  const trendingDesigners = getTrendingDesigners(4);

  const sections = React.useMemo(() => {
    const items: Array<{ kind: "filter"; config: FilterConfig } | { kind: "price" }> = [];
    let insertedPrice = false;
    filterConfigs.forEach((config) => {
      items.push({ kind: "filter", config });
      if (config.key === "type") {
        items.push({ kind: "price" });
        insertedPrice = true;
      }
    });
    if (!insertedPrice) {
      const designerIndex = items.findIndex(
        (item) => item.kind === "filter" && item.config.key === "designer",
      );
      const insertAt = designerIndex >= 0 ? designerIndex + 1 : 0;
      items.splice(insertAt, 0, { kind: "price" });
    }
    return items;
  }, [filterConfigs]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button>All filters</Button>
      </DrawerTrigger>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent
          aria-describedby={undefined}
          side="left"
          className="z-50 h-screen max-h-screen w-96 overflow-y-auto bg-white p-5 shadow-xl focus:outline-none"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <DrawerTitle className="text-lg font-semibold">All filters</DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">
                Select filters then press APPLY.
              </DrawerDescription>
            </div>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className="min-w-11 px-0 text-sm underline"
              onClick={onClear}
            >
              Clear all
            </Button>
          </div>

          <div className="space-y-6 pb-6">
            <div className="space-y-3 rounded-lg border p-3">
              <div className="text-sm font-semibold">Refine</div>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Checkbox
                  checked={draftNewIn}
                  onCheckedChange={(checked) => onChangeNewIn(checked === true)}
                />
                <span>New in</span>
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Checkbox
                  checked={draftSale}
                  onCheckedChange={(checked) => onChangeSale(checked === true)}
                />
                <span>Sale</span>
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Checkbox
                  checked={draftInStock}
                  onCheckedChange={(checked) => onChangeInStock(checked === true)}
                />
                <span>In stock</span>
              </label>
            </div>

            {sections.map((section, index) => {
              if (section.kind === "price") {
                return (
                  <div key={`price-${index}`} className="space-y-3">
                    <div className="text-sm font-semibold">Price</div>
                    <LayoutGrid columns={{ base: 2 }} gap={3}>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Min</div>
                        <Input
                          inputMode="numeric"
                          value={draftMin}
                          onChange={(event) => onChangeMin(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Max</div>
                        <Input
                          inputMode="numeric"
                          value={draftMax}
                          onChange={(event) => onChangeMax(event.target.value)}
                        />
                      </div>
                    </LayoutGrid>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onChangeMin(preset.min.toString());
                            onChangeMax(preset.max ? preset.max.toString() : "");
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              }

              const config = section.config;
              if (config.key === "designer") {
                return (
                  <div key="designer" className="space-y-3">
                    <div className="text-sm font-semibold">Designer</div>
                    <div className="space-y-2">
                      <Input
                        value={designerQuery}
                        onChange={(event) => setDesignerQuery(event.target.value)}
                        placeholder="Search designers"
                      />
                      <div className="flex flex-wrap gap-2">
                        {trendingDesigners.map((designer) => (
                          <button
                            key={`trend-${designer.handle}`}
                            type="button"
                            className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted"
                            onClick={() => onToggleValue("designer", designer.handle)}
                          >
                            {designer.name}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {filteredDesigners.map((designer) => (
                          <label
                            key={`designer-${designer.handle}`}
                            className="flex min-h-11 items-center gap-3 text-sm"
                          >
                            <Checkbox
                              checked={draftValues.designer.has(designer.handle)}
                              onCheckedChange={() => onToggleValue("designer", designer.handle)}
                            />
                            <span>{designer.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (config.key === "color") {
                if (!facetValues.color?.length) return null;
                return (
                  <div key="color" className="space-y-3">
                    <div className="text-sm font-semibold">Color</div>
                    <div className="flex flex-wrap gap-3">
                      {facetValues.color.map((color) => {
                        const selected = draftValues.color.has(color);
                        return (
                          <button
                            key={`color-${color}`}
                            type="button"
                            className="flex items-center gap-2 text-xs"
                            onClick={() => onToggleValue("color", color)}
                          >
                            <span
                              className={`h-6 w-6 rounded-full border ${selected ? "ring-2 ring-foreground" : ""}`}
                              style={{ backgroundColor: XA_COLOR_SWATCHES[color] ?? "#f5f5f5" }}
                            />
                            <span>{formatLabel(color)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const values = facetValues[config.key] ?? [];
              if (!values.length) return null;
              const openByDefault = config.key === "size";
              return (
                <details
                  key={`filter-${config.key}`}
                  open={openByDefault}
                  className="rounded-lg border p-3"
                >
                  <summary className="cursor-pointer text-sm font-semibold">
                    {config.label}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {values.map((value) => (
                      <label
                        key={`${config.key}-${value}`}
                        className="flex min-h-11 items-center gap-3 text-sm"
                      >
                        <Checkbox
                          checked={draftValues[config.key].has(value)}
                          onCheckedChange={() => onToggleValue(config.key, value)}
                        />
                        <span>{config.formatValue(value)}</span>
                      </label>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>

          <Button className="w-full" onClick={onApply}>
            APPLY
          </Button>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
