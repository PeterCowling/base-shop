"use client";
/* i18n-exempt file -- DS-4287 CSS class tokens only [ttl=2026-01-01] */

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
import StepReachSocial from "./steps/StepReachSocial";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import type { StepStatus } from "../wizard/schema";
import { cn } from "@acme/ui/utils/style";
// Tooltip not required in compact progress UI
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/shadcn";
import type { ConfiguratorStep, ConfiguratorStepTrack } from "./types";
import type { ConfiguratorStepProps } from "@/types/configurator";
import { useTranslations } from "@acme/i18n";

type TFunc = (key: string, vars?: Record<string, unknown>) => string;

/**
 * Base (keyed) metadata for step tracks. Resolved via {@link getStepTrackMeta}.
 */
const baseStepTrackMeta: Record<ConfiguratorStepTrack, {
  labelKey: string;
  descriptionKey: string;
  pillClass: string;
  accentClass: string;
}> = {
  foundation: {
    labelKey: "cms.configurator.tracks.foundation.label",
    descriptionKey: "cms.configurator.tracks.foundation.description",
    pillClass: "bg-info-soft text-fg",
    accentClass: "bg-info",
  },
  experience: {
    labelKey: "cms.configurator.tracks.experience.label",
    descriptionKey: "cms.configurator.tracks.experience.description",
    pillClass: "bg-accent-soft text-fg",
    accentClass: "bg-accent",
  },
  operations: {
    labelKey: "cms.configurator.tracks.operations.label",
    descriptionKey: "cms.configurator.tracks.operations.description",
    pillClass: "bg-warning-soft text-fg",
    accentClass: "bg-warning",
  },
  growth: {
    labelKey: "cms.configurator.tracks.growth.label",
    descriptionKey: "cms.configurator.tracks.growth.description",
    pillClass: "bg-success-soft text-fg",
    accentClass: "bg-success",
  },
};

export const getStepTrackMeta = (t?: TFunc): Record<ConfiguratorStepTrack, {
  label: string;
  description: string;
  pillClass: string;
  accentClass: string;
}> => {
  const tx: TFunc = t ?? ((key: string) => key);
  return {
    foundation: {
      label: tx(baseStepTrackMeta.foundation.labelKey) as string,
      description: tx(baseStepTrackMeta.foundation.descriptionKey) as string,
      pillClass: baseStepTrackMeta.foundation.pillClass,
      accentClass: baseStepTrackMeta.foundation.accentClass,
    },
    experience: {
      label: tx(baseStepTrackMeta.experience.labelKey) as string,
      description: tx(baseStepTrackMeta.experience.descriptionKey) as string,
      pillClass: baseStepTrackMeta.experience.pillClass,
      accentClass: baseStepTrackMeta.experience.accentClass,
    },
    operations: {
      label: tx(baseStepTrackMeta.operations.labelKey) as string,
      description: tx(baseStepTrackMeta.operations.descriptionKey) as string,
      pillClass: baseStepTrackMeta.operations.pillClass,
      accentClass: baseStepTrackMeta.operations.accentClass,
    },
    growth: {
      label: tx(baseStepTrackMeta.growth.labelKey) as string,
      description: tx(baseStepTrackMeta.growth.descriptionKey) as string,
      pillClass: baseStepTrackMeta.growth.pillClass,
      accentClass: baseStepTrackMeta.growth.accentClass,
    },
  };
};

interface BaseStepDef {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  icon?: string;
  track?: ConfiguratorStepTrack;
  component: React.ComponentType<ConfiguratorStepProps>;
  optional?: boolean;
  recommended?: string[];
}

const baseStepList: BaseStepDef[] = [
  {
    id: "shop-type",
    labelKey: "cms.configurator.steps.shopType.label",
    descriptionKey: "cms.configurator.steps.shopType.description",
    icon: "🏷️",
    track: "foundation",
    component: StepShopType as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "shop-details",
    labelKey: "cms.configurator.steps.details.label",
    descriptionKey: "cms.configurator.steps.details.description",
    icon: "🧭",
    track: "foundation",
    component: StepShopDetails,
  },
  {
    id: "theme",
    labelKey: "cms.configurator.steps.theme.label",
    descriptionKey: "cms.configurator.steps.theme.description",
    icon: "🎨",
    track: "growth",
    component: StepTheme,
    optional: true,
  },
  {
    id: "tokens",
    labelKey: "cms.configurator.steps.tokens.label",
    descriptionKey: "cms.configurator.steps.tokens.description",
    icon: "🪄",
    track: "growth",
    component: StepTokens,
    optional: true,
  },
  {
    id: "payment-provider",
    labelKey: "cms.configurator.steps.payment.label",
    descriptionKey: "cms.configurator.steps.payment.description",
    icon: "💳",
    track: "foundation",
    component: StepPaymentProvider,
  },
  {
    id: "shipping",
    labelKey: "cms.configurator.steps.shipping.label",
    descriptionKey: "cms.configurator.steps.shipping.description",
    icon: "🚚",
    track: "foundation",
    component: StepShipping,
  },
  {
    id: "checkout-page",
    labelKey: "cms.configurator.steps.checkout.label",
    descriptionKey: "cms.configurator.steps.checkout.description",
    icon: "💳",
    track: "experience",
    component: StepCheckoutPage as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "inventory",
    labelKey: "cms.configurator.steps.inventory.label",
    descriptionKey: "cms.configurator.steps.inventory.description",
    icon: "📦",
    track: "operations",
    component: StepInventory as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "env-vars",
    labelKey: "cms.configurator.steps.environment.label",
    descriptionKey: "cms.configurator.steps.environment.description",
    icon: "🔐",
    track: "operations",
    component: StepEnvVars as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "import-data",
    labelKey: "cms.configurator.steps.import.label",
    descriptionKey: "cms.configurator.steps.import.description",
    icon: "⬇️",
    track: "growth",
    component: StepImportData as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
  },
  {
    id: "reach-social",
    labelKey: "cms.configurator.steps.reachSocial.label",
    descriptionKey: "cms.configurator.steps.reachSocial.description",
    icon: "📣",
    track: "growth",
    component: StepReachSocial as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
    recommended: ["navigation-home", "theme"],
  },
  {
    id: "hosting",
    labelKey: "cms.configurator.steps.hosting.label",
    descriptionKey: "cms.configurator.steps.hosting.description",
    icon: "🚀",
    track: "operations",
    component: StepHosting as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
];

export const getSteps = (t?: TFunc): ConfiguratorStep[] => {
  const tx: TFunc = t ?? ((key: string) => key);
  return baseStepList.map((s) => ({
    id: s.id,
    label: tx(s.labelKey) as string,
    description: s.descriptionKey ? (tx(s.descriptionKey) as string) : undefined,
    icon: s.icon,
    track: s.track,
    component: s.component as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: s.optional,
    recommended: s.recommended,
  }));
};

export const getRequiredSteps = (t?: TFunc): ConfiguratorStep[] =>
  getSteps(t).filter((s) => !s.optional);

export const getStepsMap = (t?: TFunc): Record<string, ConfiguratorStep> =>
  Object.fromEntries(getSteps(t).map((s) => [s.id, s]));

/** Mapping of step id to its index in the overall flow */
export const stepIndex: Record<string, number> = Object.fromEntries(
  baseStepList.map((s, i) => [s.id, i])
);

interface ProgressProps {
  currentStepId: string;
  completed: Record<string, StepStatus | undefined>;
}

/** Horizontal progress indicator for the configurator wizard. */
export function ConfiguratorProgress({ currentStepId, completed }: ProgressProps) {
  const t = useTranslations() as unknown as TFunc;
  const list = getSteps(t);
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
          <span className="truncate w-32 sm:w-48">{prev ? prev.label : (t("cms.configurator.progress.start") as string)}</span>
        </Link>

        <div className="min-w-0 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("cms.configurator.progress.stepOf", { current, total }) as string}
          </div>
          <div className="truncate w-full text-sm font-medium text-foreground">
            {list[currentIdx]?.label}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("cms.configurator.progress.jumpAria") as string}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md border border-border-2 px-3 text-sm font-medium text-foreground hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <DotsHorizontalIcon className="h-4 w-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-auto p-0">
              {list.map((s, idx) => {
                const status = completed[s.id] ?? "pending";
                const isCurrent = idx === currentIdx;
                const statusText =
                  status === "complete"
                    ? (t("cms.configurator.progress.done") as string)
                    : status === "skipped"
                      ? (t("cms.configurator.progress.skipped") as string)
                      : (t("cms.configurator.progress.pending") as string);
                return (
                  <DropdownMenuItem
                    key={s.id}
                    className="cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      window.location.assign(`/cms/configurator/${s.id}`);
                    }}
                    title={t("cms.configurator.progress.itemTitle", { label: s.label, status: statusText }) as string}
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
                    <span className="ms-auto text-xs text-muted-foreground">{statusText}</span>
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
            <span className="truncate w-32 sm:w-48">{next ? next.label : (t("cms.configurator.progress.finish") as string)}</span>
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Unified progress bar */}
      <div className="h-1 w-full overflow-hidden rounded bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(current / total) * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
