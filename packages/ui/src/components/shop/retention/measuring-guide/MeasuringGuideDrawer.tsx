"use client";

/* eslint-disable ds/absolute-parent-guard, ds/no-nonlayered-zindex, ds/no-arbitrary-tailwind, no-restricted-syntax -- UI-9999 [ttl=2026-12-31] retention UI pending design/i18n cleanup */

import * as React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

import useViewport from "../../../../hooks/useViewport";
import { cn } from "../../../../utils/style";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  Tag,
} from "../../../atoms";

import { MeasuringGuideAnimation } from "./MeasuringGuideAnimation";

export type MeasuringGuideSizeRow = {
  sizeLabel: string;
  cmRange: string;
  inchRange?: string;
  note?: string;
};

export interface MeasuringGuideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  doneLabel: string;
  intro: string;
  animationCaption: string;
  animationDescription: string;
  rangesTitle: string;
  ranges: MeasuringGuideSizeRow[];
  tipsTitle: string;
  tips: string[];
  inBetweenBadge?: string;
}

export function MeasuringGuideDrawer({
  open,
  onOpenChange,
  title,
  closeLabel,
  doneLabel,
  intro,
  animationCaption,
  animationDescription,
  rangesTitle,
  ranges,
  tipsTitle,
  tips,
  inBetweenBadge,
}: MeasuringGuideDrawerProps) {
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const side = isMobile ? "bottom" : "right";

  const sheetClass = cn(
    // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    "overflow-hidden",
    isMobile
      ? // i18n-exempt
        "h-[100dvh] rounded-t-3xl"
      : // i18n-exempt
        "w-[520px] max-w-[95vw]",
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 z-40 bg-black/40" /> {/* i18n-exempt */}
        <DrawerContent side={side} className={sheetClass}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border-1 bg-surface-1/95 px-4 py-4 backdrop-blur">
              <DrawerTitle className="text-base font-semibold text-foreground">
                {title}
              </DrawerTitle>
              <Button
                type="button"
                variant="outline" // i18n-exempt
                className="min-h-11 min-w-11 rounded-full px-3"
                onClick={() => onOpenChange(false)}
                aria-label={closeLabel}
              >
                <Cross2Icon aria-hidden />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">{intro}</p>

                <MeasuringGuideAnimation
                  caption={animationCaption}
                  description={animationDescription}
                />

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">{rangesTitle}</div>
                  <div className="space-y-3">
                    {ranges.map((row) => (
                      <div
                        key={row.sizeLabel}
                        className="rounded-2xl border border-border-1 bg-surface-2 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {row.sizeLabel}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {row.cmRange}
                              {row.inchRange ? ` (${row.inchRange})` : ""}
                            </div>
                            {row.note ? (
                              <div className="mt-2 text-sm text-muted-foreground">
                                {row.note}
                              </div>
                            ) : null}
                          </div>
                          {inBetweenBadge && row.note ? (
                            <Tag size="sm" color="accent" tone="soft">
                              {inBetweenBadge}
                            </Tag>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {tips.length ? (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-foreground">{tipsTitle}</div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {tips.map((tip) => (
                        <li key={tip} className="rounded-2xl border border-border-1 bg-surface-2 p-4">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-border-1 bg-surface-1/95 px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-4 backdrop-blur">
              <Button
                type="button"
                color="accent"
                tone="solid"
                className="min-h-11 w-full rounded-full px-5"
                onClick={() => onOpenChange(false)}
              >
                {doneLabel}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
