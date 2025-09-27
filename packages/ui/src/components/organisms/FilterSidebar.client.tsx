"use client";

import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "../atoms/primitives/drawer";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms/primitives/select";
import { OverlayScrim } from "../atoms";
import { useTranslations } from "@acme/i18n";
// i18n-exempt: CSS utility classes only
const CONTENT_CLASSES = "p-4 focus:outline-none"; // i18n-exempt: CSS classes

export type Filters = { size?: string };

export interface FilterSidebarProps {
  onChange: (filters: Filters) => void;
  /**
   * Width of the sidebar. Provide a Tailwind width class
   * (e.g. "w-64") or a numeric pixel value.
   * @default "w-64"
   */
  width?: string | number;
}

export function FilterSidebar({
  onChange,
  width = "w-64",
}: FilterSidebarProps) {
  const [open, setOpen] = React.useState(false);
  const [size, setSize] = React.useState("");
  const deferredSize = React.useDeferredValue(size);
  const t = useTranslations();

  React.useEffect(() => {
    onChange({ size: deferredSize || undefined });
  }, [deferredSize, onChange]);

  // Pass numeric width directly; DrawerContent applies inline styles for numbers
  const widthClass = typeof width === "number" ? width : width;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">{t("filters.trigger")}</Button>
      </DrawerTrigger>
      <DrawerPortal>
        {/* Use approved overlay component to satisfy design-system z-index rules */}
        <OverlayScrim />
        <DrawerContent
          aria-describedby={undefined}
          side="left"
          width={widthClass}
          className={cn(
            CONTENT_CLASSES
          )}
        >
          <DrawerTitle className="mb-4 text-lg font-semibold">{t("filters.title")}</DrawerTitle>
          <DrawerDescription className="sr-only">{t("filters.description")}</DrawerDescription>
          <form
            aria-label={t("filters.accessibleLabel") as string}
            className="space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="size-select">
                {t("filters.size.label")}
              </label>
              <Select
                value={size}
                onValueChange={(v) => setSize(v === "all" ? "" : v)}
              >
                <SelectTrigger id="size-select" className="w-full">
                  <SelectValue placeholder={t("filters.size.all") as string} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.size.all")}</SelectItem>
                  {["36", "37", "38", "39", "40", "41", "42", "43", "44"].map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </form>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
