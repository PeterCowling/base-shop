"use client";

import * as React from "react";

import { Button, OverlayScrim } from "@acme/design-system/atoms";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@acme/design-system/primitives/drawer";

import { xaI18n } from "../lib/xaI18n";

import { buildSections, computeAppliedCount } from "./filters/XaFiltersDrawer.helpers";
import type { XaFiltersDrawerProps } from "./filters/XaFiltersDrawer.types";
import {
  ColorSection,
  DesignerSection,
  GenericFilterSection,
  PriceSection,
  RefineSection,
} from "./filters/XaFiltersDrawerSections";

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
  const [sectionOpen, setSectionOpen] = React.useState<Record<string, boolean>>({});

  const appliedCount = React.useMemo(
    () =>
      computeAppliedCount({
        draftValues,
        draftInStock,
        draftSale,
        draftNewIn,
        draftMin,
        draftMax,
      }),
    [draftValues, draftInStock, draftSale, draftNewIn, draftMin, draftMax],
  );

  const sections = React.useMemo(() => buildSections(filterConfigs), [filterConfigs]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button>
          All filters
          {appliedCount > 0 && (
            <span className="ms-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 xa-text-10 font-semibold text-primary-fg">
              {appliedCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent
          aria-describedby={undefined}
          side="left"
          className="z-50 h-screen max-h-screen w-96 overflow-y-auto bg-surface p-5 shadow-xl focus:outline-none"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <DrawerTitle className="text-lg font-semibold">All filters</DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">
                {xaI18n.t("xaB.src.components.xafiltersdrawer.client.l147c76")}
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
            <RefineSection
              draftInStock={draftInStock}
              draftSale={draftSale}
              draftNewIn={draftNewIn}
              onChangeInStock={onChangeInStock}
              onChangeSale={onChangeSale}
              onChangeNewIn={onChangeNewIn}
            />

            {sections.map((section, index) => {
              if (section.kind === "price") {
                return (
                  <PriceSection
                    key={`price-${index}`}
                    draftMin={draftMin}
                    draftMax={draftMax}
                    onChangeMin={onChangeMin}
                    onChangeMax={onChangeMax}
                  />
                );
              }

              const config = section.config;
              if (config.key === "designer") {
                return (
                  <DesignerSection
                    key="designer"
                    draftValues={draftValues}
                    facetValues={facetValues}
                    onToggleValue={onToggleValue}
                  />
                );
              }

              if (config.key === "color") {
                return (
                  <ColorSection
                    key="color"
                    draftValues={draftValues}
                    facetValues={facetValues}
                    onToggleValue={onToggleValue}
                  />
                );
              }

              const values = facetValues[config.key] ?? [];
              if (!values.length) return null;
              const openByDefault = config.key === "size";
              const isOpen = sectionOpen[config.key] ?? openByDefault;

              return (
                <GenericFilterSection
                  key={`generic-${config.key}`}
                  config={config}
                  values={values}
                  isOpen={isOpen}
                  setSectionOpen={setSectionOpen}
                  draftValues={draftValues}
                  onToggleValue={onToggleValue}
                />
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
