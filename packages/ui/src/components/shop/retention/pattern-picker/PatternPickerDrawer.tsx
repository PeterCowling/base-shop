"use client";

/* eslint-disable ds/absolute-parent-guard, ds/no-nonlayered-zindex, ds/no-arbitrary-tailwind, no-restricted-syntax -- UI-9999 [ttl=2026-12-31] retention UI pending design/i18n cleanup */

import * as React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "../../../../utils/style";
import {
  Button,
  Drawer,
  DrawerPortal,
  DrawerContent,
  DrawerOverlay,
  DrawerTitle,
  DrawerDescription,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from "../../../atoms";
import useViewport from "../../../../hooks/useViewport";
import type { PatternColorFamily, PatternContrast, PatternOption, PatternTheme } from "../types";
import { PatternPickerGrid } from "./PatternPickerGrid";

type FilterOption = { value: string; label: string };

export interface PatternPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
  closeOnSelect?: boolean;

  title: string;
  doneLabel: string;
  clearLabel?: string | undefined;
  closeLabel: string;
  selectedLabel: string;
  selectedPrefix: string;
  unavailableLabel?: string | undefined;

  searchLabel: string;
  searchPlaceholder: string;

  colorFamilyLabel: string;
  themeLabel: string;
  contrastLabel: string;
  toneLabel: string;
  availabilityLabel: string;

  patterns: PatternOption[];
  selectedKey?: string | undefined;
  onSelect: (patternKey: string) => void;
  onClear?: (() => void) | undefined;

  isPatternAvailable?: (patternKey: string) => boolean;

  colorFamilyOptions: FilterOption[];
  themeOptions: FilterOption[];
  contrastOptions: FilterOption[];
  toneOptions: FilterOption[];
}

const matchesSearch = (pattern: PatternOption, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [pattern.name, pattern.key, ...(pattern.tags ?? [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
};

export function PatternPickerDrawer({
  open,
  onOpenChange,
  onDone,
  closeOnSelect = false,
  title,
  doneLabel,
  clearLabel,
  closeLabel,
  selectedLabel,
  selectedPrefix,
  unavailableLabel,
  searchLabel,
  searchPlaceholder,
  colorFamilyLabel,
  themeLabel,
  contrastLabel,
  toneLabel,
  availabilityLabel,
  patterns,
  selectedKey,
  onSelect,
  onClear,
  isPatternAvailable,
  colorFamilyOptions,
  themeOptions,
  contrastOptions,
  toneOptions,
}: PatternPickerDrawerProps) {
  const viewport = useViewport();
  const isMobile = viewport === "mobile";

  const [query, setQuery] = React.useState("");
  const [colorFamily, setColorFamily] = React.useState<string>("all");
  const [theme, setTheme] = React.useState<string>("all");
  const [contrast, setContrast] = React.useState<string>("all");
  const [tone, setTone] = React.useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = React.useState(false);

  const availableByKey = React.useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of patterns) {
      map.set(p.key, isPatternAvailable ? Boolean(isPatternAvailable(p.key)) : true);
    }
    return map;
  }, [isPatternAvailable, patterns]);

  const filtered = React.useMemo(() => {
    return patterns.filter((p) => {
      if (!matchesSearch(p, query)) return false;
      if (colorFamily !== "all" && p.colorFamily !== (colorFamily as PatternColorFamily)) return false;
      if (theme !== "all" && p.theme !== (theme as PatternTheme)) return false;
      if (contrast !== "all" && p.contrast !== (contrast as PatternContrast)) return false;
      if (tone !== "all") {
        const kid = Boolean(p.kidFriendly);
        if (tone === "kid" && !kid) return false;
        if (tone === "neutral" && kid) return false;
      }
      if (onlyAvailable && !availableByKey.get(p.key)) return false;
      return true;
    });
  }, [availableByKey, colorFamily, contrast, onlyAvailable, patterns, query, theme, tone]);

  const selected = React.useMemo(
    () => patterns.find((p) => p.key === selectedKey),
    [patterns, selectedKey],
  );

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleDone = React.useCallback(() => {
    onDone?.();
    onOpenChange(false);
  }, [onDone, onOpenChange]);
  const handleSelect = React.useCallback(
    (patternKey: string) => {
      onSelect(patternKey);
      if (closeOnSelect) onOpenChange(false);
    },
    [closeOnSelect, onOpenChange, onSelect],
  );

  const sheetSide = isMobile ? "bottom" : "right";
  const sheetClass = cn(
    // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    "overflow-hidden",
    isMobile
      ? // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "h-[100dvh] rounded-t-3xl"
      : // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "w-[560px] max-w-[95vw]",
  );

  const showFiltersInline = !isMobile;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 z-40 bg-black/40" /> {/* i18n-exempt */}
        <DrawerContent side={sheetSide} className={sheetClass}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border-1 bg-surface-1/95 px-4 py-4 backdrop-blur">
              <div className="min-w-0">
                <DrawerTitle className="text-base font-semibold text-foreground">
                  {title}
                </DrawerTitle>
                <DrawerDescription className="mt-0.5 text-sm text-muted-foreground">
                  {selected ? (
                    <span>
                      {selectedPrefix}{" "}
                      <span className="font-semibold text-foreground">
                        {selected.name}
                      </span>
                    </span>
                  ) : null}
                </DrawerDescription>
              </div>
              <div className="flex items-center gap-2">
                {clearLabel && onClear ? (
                  <Button
                    type="button"
                    variant="outline" // i18n-exempt
                    className="min-h-11 rounded-full px-4 text-sm"
                    onClick={onClear}
                  >
                    {clearLabel}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline" // i18n-exempt
                  className="min-h-11 min-w-11 rounded-full px-3"
                  onClick={close}
                  aria-label={closeLabel}
                >
                  <Cross2Icon aria-hidden />
                </Button>
              </div>
            </div>

            <div
              className={cn(
                "flex-1 overflow-y-auto p-4",
                closeOnSelect ? "pb-[calc(var(--safe-bottom)+1rem)]" : null,
              )}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                    {searchLabel}
                  </label>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="min-h-11 rounded-full"
                  />
                </div>

                <div
                  className={cn(
                    "grid gap-3",
                    showFiltersInline ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                      {colorFamilyLabel}
                    </div>
                    <Select value={colorFamily} onValueChange={setColorFamily}>
                      <SelectTrigger className="min-h-11 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorFamilyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                      {themeLabel}
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="min-h-11 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {themeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                      {contrastLabel}
                    </div>
                    <Select value={contrast} onValueChange={setContrast}>
                      <SelectTrigger className="min-h-11 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contrastOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                      {toneLabel}
                    </div>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="min-h-11 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-border-1 bg-surface-2 px-4">
                    <Checkbox
                      checked={onlyAvailable}
                      onCheckedChange={(v) => setOnlyAvailable(Boolean(v))}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {availabilityLabel}
                    </span>
                  </label>
                </div>

                <PatternPickerGrid
                  patterns={patterns}
                  filtered={filtered}
                  selectedKey={selectedKey}
                  selectedLabel={selectedLabel}
                  unavailableLabel={unavailableLabel}
                  availableByKey={availableByKey}
                  onSelect={handleSelect}
                />
              </div>
            </div>

            {!closeOnSelect ? (
              <div className="border-t border-border-1 bg-surface-1/95 px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 text-sm text-muted-foreground">
                    {selected ? (
                      <span className="truncate">
                        {selectedPrefix}{" "}
                        <span className="font-semibold text-foreground">
                          {selected.name}
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    color="accent"
                    tone="solid"
                    className="min-h-11 rounded-full px-5"
                    onClick={handleDone}
                  >
                    {doneLabel}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
