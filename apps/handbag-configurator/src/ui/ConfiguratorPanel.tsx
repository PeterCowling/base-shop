"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { Loader } from "@acme/design-system/atoms";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@acme/design-system/primitives";
import {
  Card,
  CardContent,
} from "@acme/design-system/shadcn";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n/Translations";
import type {
  ProductConfigSchema,
  ProductHotspotConfig,
  SelectionState,
  ValidateResponse,
} from "@acme/product-configurator";

import { useModeStore } from "../viewer/state/modeStore";
import {
  getSwatchKind,
  getSwatchStyle,
} from "../viewer/swatchStyles";

type ConfiguratorPanelProps = {
  schema?: ProductConfigSchema;
  hotspotConfig?: ProductHotspotConfig | null;
  selections: SelectionState;
  validation?: ValidateResponse | null;
  validationStatus?: "idle" | "loading" | "error";
  onSelect?: (key: string, value: string) => void;
};

function PanelContent({
  schema,
  hotspotConfig,
  selections,
  validation,
  validationStatus = "idle",
  onSelect,
}: ConfiguratorPanelProps) {
  const activeRegionId = useModeStore((state) => state.activeRegionId);
  const activeHotspotId = useModeStore((state) => state.activeHotspotId);
  const allowedDomains = validation?.allowedDomainsDelta ?? {};
  const blockedReasons = validation?.blockedReasons ?? [];
  const t = useTranslations();
  const activeProperties = useMemo(() => {
    if (!schema || !activeRegionId) return [];
    const hotspot = hotspotConfig?.hotspots?.find(
      (entry) => entry.id === activeHotspotId,
    );
    const allowedKeys = hotspot?.propertyKeys?.length
      ? new Set(hotspot.propertyKeys)
      : null;
    return schema.properties.filter((property) => {
      if (property.regionId !== activeRegionId) return false;
      return allowedKeys ? allowedKeys.has(property.key) : true;
    });
  }, [activeRegionId, activeHotspotId, hotspotConfig, schema]);

  const getSectionTitle = (property: ProductConfigSchema["properties"][number]) => {
    const label = property.displayName.toLowerCase();
    if (label.includes("material")) return t("handbagConfigurator.section.materials");
    if (label.includes("color")) return t("handbagConfigurator.section.color");
    if (label.includes("hardware")) return t("handbagConfigurator.section.color");
    if (label.includes("monogram")) return t("handbagConfigurator.section.monogram");
    return property.displayName;
  };

  if (!schema) {
    return (
      <Card className="cfgMiniCard cfgMiniCard--message">
        <CardContent className="cfgMiniCard__message">
          {t("handbagConfigurator.schemaMissing")}
        </CardContent>
      </Card>
    );
  }

  if (!activeRegionId) {
    return null;
  }

  return (
    <>
      {validationStatus === "loading" ? (
        <div className="flex items-center justify-center py-4">
          <Loader size={24} label={t("handbagConfigurator.validating")} />
        </div>
      ) : null}
      {validationStatus === "error" ? (
        <Card className="cfgMiniCard cfgMiniCard--message">
          <CardContent className="cfgMiniCard__message">
            {t("handbagConfigurator.validationUnavailable")}
          </CardContent>
        </Card>
      ) : null}
      {blockedReasons.length > 0 ? (
        <Card className="cfgMiniCard cfgMiniCard--message">
          <CardContent className="cfgMiniCard__message">
            {blockedReasons[0]?.message}
          </CardContent>
        </Card>
      ) : null}
      {activeProperties.length === 0 && validationStatus !== "loading" ? (
        <Card className="cfgMiniCard cfgMiniCard--message">
          <CardContent className="cfgMiniCard__message">
            {t("handbagConfigurator.noOptionsYet")}
          </CardContent>
        </Card>
      ) : null}
      {activeProperties.map((property) => {
        const selectedValue = selections[property.key] ?? property.defaultValue;
        const selectedLabel =
          property.values.find((entry) => entry.value === selectedValue)?.label ??
          selectedValue;
        const limitedDomain = allowedDomains[property.key];
        const allowedValues = Array.isArray(limitedDomain) ? limitedDomain : null;
        const visibleValues = allowedValues
          ? property.values.filter((value) => allowedValues.includes(value.value))
          : property.values;
        const title = getSectionTitle(property);
        const swatchKind = getSwatchKind(property);
        const previewStyle = getSwatchStyle(selectedValue, swatchKind);
        const panelKey = property.key;
        const optionCount = visibleValues.length;
        const columns = 4;
        return (
          <Card key={property.key} className="cfgMiniCard">
            <CardContent className="cfgMiniCard__content">
              <div
                className="cfgMiniCard__preview"
                aria-hidden="true"
                style={previewStyle}
              />
              <div className="cfgMiniCard__text">
                <div className="cfgMiniCard__title">{title}</div>
                <div className="cfgMiniCard__subtitle">{selectedLabel}</div>
              </div>
              <div className="cfgMiniCard__options" role="radiogroup" aria-label={title}>
                {visibleValues.map((value, optionIndex) => {
                  const selected = selectedValue === value.value;
                  const swatchId = `cfg-mini-${panelKey}-${value.value}`.replace(
                    /[^a-zA-Z0-9_-]/g,
                    "-",
                  );
                  const handleKeyDown = (
                    event: KeyboardEvent<HTMLButtonElement>,
                  ) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      onSelect?.(property.key, value.value);
                      return;
                    }
                    let nextIndex = optionIndex;
                    if (event.key === "ArrowRight") {
                      nextIndex = (optionIndex + 1) % optionCount;
                    } else if (event.key === "ArrowLeft") {
                      nextIndex = (optionIndex - 1 + optionCount) % optionCount;
                    } else if (event.key === "ArrowDown") {
                      const candidate = optionIndex + columns;
                      if (candidate < optionCount) nextIndex = candidate;
                    } else if (event.key === "ArrowUp") {
                      const candidate = optionIndex - columns;
                      if (candidate >= 0) nextIndex = candidate;
                    } else {
                      return;
                    }
                    if (nextIndex !== optionIndex) {
                      event.preventDefault();
                      const nextValue = visibleValues[nextIndex];
                      if (nextValue) {
                        const nextId = `cfg-mini-${panelKey}-${nextValue.value}`.replace(
                          /[^a-zA-Z0-9_-]/g,
                          "-",
                        );
                        const nextEl = document.getElementById(nextId);
                        if (nextEl instanceof HTMLElement) {
                          nextEl.focus();
                        }
                      }
                    }
                  };
                  return (
                    <button
                      id={swatchId}
                      key={value.value}
                      type="button"
                      className={cn(
                        "cfgMiniSwatch",
                        selected && "cfgMiniSwatch--selected",
                      )}
                      role="radio"
                      aria-checked={selected}
                      data-value={value.value}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => onSelect?.(property.key, value.value)}
                      onKeyDown={handleKeyDown}
                      aria-label={value.label}
                    >
                      <span
                        className="cfgMiniSwatch__fill"
                        aria-hidden="true"
                        style={getSwatchStyle(value.value, swatchKind)}
                      />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

export function ConfiguratorPanel(props: ConfiguratorPanelProps) {
  const panelOpen = useModeStore((state) => state.panelOpen);
  const activeRegionId = useModeStore((state) => state.activeRegionId);
  const closePanel = useModeStore((state) => state.closePanel);
  const clearActiveRegion = useModeStore((state) => state.clearActiveRegion);
  const [isMobile, setIsMobile] = useState(false);
  const t = useTranslations();

  // Detect mobile viewport for drawer vs flyout
  useEffect(() => {
    // i18n-exempt -- HAND-101 [ttl=2026-12-31]: media query string is technical configuration, not user-facing copy.
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!panelOpen) return null;

  if (isMobile) {
    const isOpen = panelOpen && !!activeRegionId;
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closePanel();
            clearActiveRegion();
          }
        }}
      >
        <DrawerContent
          side="bottom"
          className="max-h-dvh overflow-y-auto p-4"
        >
          <DrawerTitle className="sr-only">
            {t("handbagConfigurator.configuratorTitle")}
          </DrawerTitle>
          <div className="flex flex-col gap-3">
            <PanelContent {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="cfgFlyout" style={{ top: "16px" }}>
      <PanelContent {...props} />
    </div>
  );
}
