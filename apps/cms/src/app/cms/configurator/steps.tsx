"use client";

import StepShopDetails from "./steps/StepShopDetails";
import StepShopType from "./steps/StepShopType";
import StepTheme from "./steps/StepTheme";
import StepTokens from "./steps/StepTokens";
import StepPaymentProvider from "./steps/StepPaymentProvider";
import StepShipping from "./steps/StepShipping";
import StepCheckoutPage from "./steps/StepCheckoutPage";
import StepInventory from "./steps/StepInventory";
import StepEnvVars from "./steps/StepEnvVars";
import StepImportData from "./steps/StepImportData";
import StepHosting from "./steps/StepHosting";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import type { StepStatus } from "../wizard/schema";
import { cn } from "@ui/utils/style";
// Tooltip not required in compact progress UI
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/shadcn";
import type { ConfiguratorStep, ConfiguratorStepTrack } from "./types";
import type { ConfiguratorStepProps } from "@/types/configurator";

export const stepTrackMeta: Record<ConfiguratorStepTrack, {
  label: string;
  description: string;
  pillClass: string;
  accentClass: string;
}> = {
  foundation: {
    label: "Foundation",
    description: "Brand setup, compliance, and the fundamentals that every shop needs.",
    pillClass: "bg-info-soft text-fg",
    accentClass: "bg-info",
  },
  experience: {
    label: "Experience",
    description: "Design how shoppers explore, interact, and fall in love with your products.",
    pillClass: "bg-accent-soft text-fg",
    accentClass: "bg-accent",
  },
  operations: {
    label: "Operations",
    description: "Wire up integrations, environments, and go-live readiness.",
    pillClass: "bg-warning-soft text-fg",
    accentClass: "bg-warning",
  },
  growth: {
    label: "Growth",
    description: "Optional boosters that accelerate content, experimentation, and scale.",
    pillClass: "bg-success-soft text-fg",
    accentClass: "bg-success",
  },
};

const stepList: ConfiguratorStep[] = [
  {
    id: "shop-type",
    label: "Shop Type",
    description: "Choose whether your shop rents products or sells them.",
    icon: "🏷️",
    track: "foundation",
    component: StepShopType as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "shop-details",
    label: "Details",
    description: "Set your brand essentials, contact information, and launch-ready metadata.",
    icon: "🧭",
    track: "foundation",
    component: StepShopDetails,
  },
  {
    id: "theme",
    label: "Theme",
    description: "Choose the base theme that defines the tone and feel of your storefront.",
    icon: "🎨",
    track: "growth",
    component: StepTheme,
    optional: true,
  },
  {
    id: "tokens",
    label: "Fonts",
    description: "Pick a font pairing for headings and body.",
    icon: "🪄",
    track: "growth",
    component: StepTokens,
    optional: true,
  },
  {
    id: "payment-provider",
    label: "Payment Provider",
    description: "Connect payment gateways and basic analytics.",
    icon: "💳",
    track: "foundation",
    component: StepPaymentProvider,
  },
  {
    id: "shipping",
    label: "Shipping",
    description: "Connect shipping providers for fulfillment.",
    icon: "🚚",
    track: "foundation",
    component: StepShipping,
  },
  {
    id: "checkout-page",
    label: "Checkout",
    description: "Craft a high-trust checkout flow with clear steps and reassuring details.",
    icon: "💳",
    track: "experience",
    component: StepCheckoutPage as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Manage stock tracking, low-stock alerts, and backorders.",
    icon: "📦",
    track: "operations",
    component: StepInventory as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "env-vars",
    label: "Environment",
    description: "Securely connect providers, analytics, and third-party services.",
    icon: "🔐",
    track: "operations",
    component: StepEnvVars as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "import-data",
    label: "Import Data",
    description: "Bring in existing catalog data, assets, and content from other systems.",
    icon: "⬇️",
    track: "growth",
    component: StepImportData as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
  },
  {
    id: "hosting",
    label: "Hosting & Delivery",
    description: "Choose deployment targets, edge regions, and performance presets.",
    icon: "🚀",
    track: "operations",
    component: StepHosting as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
];

export const getSteps = (): ConfiguratorStep[] => [...stepList];

export const getRequiredSteps = (): ConfiguratorStep[] =>
  getSteps().filter((s) => !s.optional);

export const steps: Record<string, ConfiguratorStep> = Object.fromEntries(
  getSteps().map((s) => [s.id, s])
);

/** Mapping of step id to its index in the overall flow */
export const stepIndex: Record<string, number> = Object.fromEntries(
  stepList.map((s, i) => [s.id, i])
);

interface ProgressProps {
  currentStepId: string;
  completed: Record<string, StepStatus | undefined>;
}

/** Horizontal progress indicator for the configurator wizard. */
export function ConfiguratorProgress({ currentStepId, completed }: ProgressProps) {
  const list = getSteps();
  const currentIdx = stepIndex[currentStepId] ?? 0;
  const total = list.length;
  const current = Math.min(currentIdx + 1, total);
  const prev = list[currentIdx - 1];
  const next = list[currentIdx + 1];

  return (
    <div className="space-y-3">
      {/* Compact header with prev/next and a jump menu to avoid overflow */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={prev ? `/cms/configurator/${prev.id}` : `#`}
          aria-disabled={!prev}
          tabIndex={prev ? 0 : -1}
          className={cn(
            "inline-flex h-9 min-w-0 items-center gap-2 rounded-md border border-border-2 px-3 text-sm font-medium text-foreground",
            !prev && "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          <span className="truncate max-w-[8rem] sm:max-w-[12rem]">{prev ? prev.label : "Start"}</span>
        </Link>

        <div className="min-w-0 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Step {current} of {total}
          </div>
          <div className="truncate text-sm font-medium text-foreground max-w-[18rem] sm:max-w-[28rem] md:max-w-[36rem]">
            {list[currentIdx]?.label}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Jump to step"
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md border border-border-2 px-3 text-sm font-medium text-foreground hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <DotsHorizontalIcon className="h-4 w-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[60vh] w-72 overflow-auto p-0">
              {list.map((s, idx) => {
                const status = completed[s.id] ?? "pending";
                const isCurrent = idx === currentIdx;
                const statusText = status === "complete" ? "Done" : status === "skipped" ? "Skipped" : "Pending";
                return (
                  <DropdownMenuItem
                    key={s.id}
                    className="cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      window.location.assign(`/cms/configurator/${s.id}`);
                    }}
                    title={`${s.label} — ${statusText}`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "mr-2 grid size-6 place-content-center rounded-full border text-xs",
                        completed[s.id] === "complete" && "bg-primary border-primary text-primary-fg",
                        isCurrent && "border-primary"
                      )}
                    >
                      {completed[s.id] === "complete" ? <CheckIcon className="h-4 w-4" aria-hidden /> : idx + 1}
                    </span>
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{statusText}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href={next ? `/cms/configurator/${next.id}` : `#`}
            aria-disabled={!next}
            tabIndex={next ? 0 : -1}
            className={cn(
              "inline-flex h-9 min-w-0 items-center gap-2 rounded-md border border-border-2 px-3 text-sm font-medium text-foreground",
              !next && "pointer-events-none opacity-50",
            )}
          >
            <span className="truncate max-w-[8rem] sm:max-w-[12rem]">{next ? next.label : "Finish"}</span>
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Unified progress bar */}
      <div className="h-1 w-full overflow-hidden rounded bg-muted">
        <div
          className="h-full bg-primary transition-[width]"
          style={{ width: `${(current / total) * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
