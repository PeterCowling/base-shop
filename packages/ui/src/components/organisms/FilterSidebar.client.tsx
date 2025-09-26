"use client";

import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
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

  React.useEffect(() => {
    onChange({ size: deferredSize || undefined });
  }, [deferredSize, onChange]);

  const widthClass = typeof width === "number" ? `w-[${width}px]` : width;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Filters</Button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 z-40 bg-[hsl(var(--overlay-scrim-1))]" />
        <DrawerContent
          aria-describedby={undefined}
          side="left"
          width={widthClass}
          className={cn(
            "p-4 focus:outline-none"
          )}
        >
          <DrawerTitle className="mb-4 text-lg font-semibold">Filters</DrawerTitle>
          <DrawerDescription className="sr-only">Use filters to refine results</DrawerDescription>
          <form
            aria-label="Filters"
            className="space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="size-select">
                Size
              </label>
              <Select
                value={size}
                onValueChange={(v) => setSize(v === "all" ? "" : v)}
              >
                {" "}
                <SelectTrigger id="size-select" className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
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
