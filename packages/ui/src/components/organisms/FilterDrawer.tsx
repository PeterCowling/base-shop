"use client";

import * as React from "react";

import { cn } from "../../utils/style";
import { OverlayScrim } from "../atoms";
import { Button } from "../atoms/primitives/button";
import { Cluster } from "../atoms/primitives/Cluster";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "../atoms/primitives/drawer";
import { Stack } from "../atoms/primitives/Stack";

export interface FilterDrawerProps {
  triggerLabel: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  clearLabel: React.ReactNode;
  applyLabel: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  onClear: () => void;
  onApply: () => void;
  children: React.ReactNode;
}

export function FilterDrawer({
  triggerLabel,
  title,
  description,
  clearLabel,
  applyLabel,
  onOpenChange,
  onClear,
  onApply,
  children,
}: FilterDrawerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      <DrawerTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DrawerTrigger>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent
          aria-describedby={undefined}
          side="left"
          className={cn("p-4 focus:outline-none", "w-80")}
        >
          <Cluster alignY="center" justify="between" className="mb-4 gap-4">
            <div className="min-w-0">
              <DrawerTitle className="text-lg font-semibold">
                {title}
              </DrawerTitle>
              {description ? (
                <DrawerDescription className="text-sm text-muted-foreground">
                  {description}
                </DrawerDescription>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center text-sm underline"
              onClick={() => onClear()}
            >
              {clearLabel}
            </button>
          </Cluster>

          <Stack gap={6} className="pb-6">
            {children}
          </Stack>

          <Button
            className="w-full"
            onClick={() => {
              onApply();
              setOpen(false);
            }}
          >
            {applyLabel}
          </Button>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

