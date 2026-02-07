"use client";
/* i18n-exempt file -- DS-4287 CSS class tokens only [ttl=2026-01-01] */

import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

import { Inline } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n";

import type { StepStatus } from "../../wizard/schema";

import StepCommerceTemplates from "./steps/StepCommerceTemplates";
import StepComplianceSeo from "./steps/StepComplianceSeo";
import StepProductSelection from "./steps/StepProductSelection";
import StepShopIdentity from "./steps/StepShopIdentity";
import StepThemeBrandKit from "./steps/StepThemeBrandKit";
import type { RapidLaunchStep } from "./types";

type TFunc = (key: string, vars?: Record<string, unknown>) => string;

interface BaseStepDef {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  icon?: string;
  component: RapidLaunchStep["component"];
}

const baseSteps: BaseStepDef[] = [
  {
    id: "shop-identity",
    labelKey: "cms.rapidLaunch.steps.identity.label",
    descriptionKey: "cms.rapidLaunch.steps.identity.description",
    icon: "🧭",
    component: StepShopIdentity,
  },
  {
    id: "theme-brand",
    labelKey: "cms.rapidLaunch.steps.brand.label",
    descriptionKey: "cms.rapidLaunch.steps.brand.description",
    icon: "🎨",
    component: StepThemeBrandKit,
  },
  {
    id: "products",
    labelKey: "cms.rapidLaunch.steps.products.label",
    descriptionKey: "cms.rapidLaunch.steps.products.description",
    icon: "🛍️",
    component: StepProductSelection,
  },
  {
    id: "commerce",
    labelKey: "cms.rapidLaunch.steps.commerce.label",
    descriptionKey: "cms.rapidLaunch.steps.commerce.description",
    icon: "💳",
    component: StepCommerceTemplates,
  },
  {
    id: "compliance",
    labelKey: "cms.rapidLaunch.steps.compliance.label",
    descriptionKey: "cms.rapidLaunch.steps.compliance.description",
    icon: "✅",
    component: StepComplianceSeo,
  },
];

export const getRapidLaunchSteps = (t?: TFunc): RapidLaunchStep[] => {
  const tx: TFunc = t ?? ((key: string) => key);
  return baseSteps.map((s) => ({
    id: s.id,
    label: tx(s.labelKey) as string,
    description: s.descriptionKey ? (tx(s.descriptionKey) as string) : undefined,
    icon: s.icon,
    component: s.component,
  }));
};

export const getRapidLaunchStepsMap = (t?: TFunc): Record<string, RapidLaunchStep> =>
  Object.fromEntries(getRapidLaunchSteps(t).map((s) => [s.id, s]));

export const rapidLaunchStepIndex: Record<string, number> = Object.fromEntries(
  baseSteps.map((s, i) => [s.id, i])
);

interface ProgressProps {
  currentStepId: string;
  completed: Record<string, StepStatus | undefined>;
}

export function RapidLaunchProgress({ currentStepId, completed }: ProgressProps) {
  const t = useTranslations() as unknown as TFunc;
  const list = getRapidLaunchSteps(t);
  const currentIdx = rapidLaunchStepIndex[currentStepId] ?? 0;
  const total = list.length;
  const current = Math.min(currentIdx + 1, total);
  const prev = list[currentIdx - 1];
  const next = list[currentIdx + 1];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={prev ? `/cms/configurator/rapid-launch/${prev.id}` : "#"}
          aria-disabled={!prev}
          tabIndex={prev ? 0 : -1}
          className={cn(
            "inline-flex h-9 min-w-0 items-center gap-2 rounded-md border border-border-2 px-3 text-sm font-medium text-foreground",
            !prev && "pointer-events-none opacity-50"
          )}
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          <span className="truncate w-32 sm:w-48">
            {prev ? prev.label : (t("cms.rapidLaunch.progress.start") as string)}
          </span>
        </Link>

        <div className="min-w-0 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("cms.rapidLaunch.progress.stepOf", { current, total }) as string}
          </div>
          <div className="truncate w-full text-sm font-medium text-foreground">
            {list[currentIdx]?.label}
          </div>
        </div>

        <Link
          href={next ? `/cms/configurator/rapid-launch/${next.id}` : "#"}
          aria-disabled={!next}
          tabIndex={next ? 0 : -1}
          className={cn(
            "inline-flex h-9 min-w-0 items-center gap-2 rounded-md border border-border-2 px-3 text-sm font-medium text-foreground",
            !next && "pointer-events-none opacity-50"
          )}
        >
          <span className="truncate w-32 sm:w-48">
            {next ? next.label : (t("cms.rapidLaunch.progress.finish") as string)}
          </span>
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <Inline gap={2} alignY="center">
        {list.map((step, idx) => {
          const status = completed[step.id] ?? "pending";
          const isCurrent = idx === currentIdx;
          return (
            <div
              key={step.id}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                isCurrent && "border-primary text-primary",
                status === "complete" && "bg-primary text-primary-fg border-primary",
                status !== "complete" && !isCurrent && "text-muted-foreground"
              )}
            >
              <Inline
                asChild
                gap={0}
                wrap={false}
                alignY="center"
                className="size-5 justify-center rounded-full border text-xs"
              >
                <span>
                {status === "complete" ? (
                  <CheckIcon className="h-3 w-3" aria-hidden />
                ) : (
                  idx + 1
                )}
                </span>
              </Inline>
              {step.label}
            </div>
          );
        })}
      </Inline>
    </div>
  );
}
