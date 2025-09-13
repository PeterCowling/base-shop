"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
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
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline">Filters</Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-fg/50" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            widthClass,
            "bg-background fixed inset-y-0 left-0 z-50 border-r p-4 shadow-lg focus:outline-none"
          )}
        >
          <DialogPrimitive.Title className="mb-4 text-lg font-semibold">
            Filters
          </DialogPrimitive.Title>
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
