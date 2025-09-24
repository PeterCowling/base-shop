"use client";

import StepShopDetails from "./steps/StepShopDetails";
import StepTheme from "./steps/StepTheme";
import StepTokens from "./steps/StepTokens";
import StepOptions from "./steps/StepOptions";
import StepNavigation from "./steps/StepNavigation";
import StepLayout from "./steps/StepLayout";
import StepHomePage from "./steps/StepHomePage";
import StepCheckoutPage from "./steps/StepCheckoutPage";
import StepShopPage from "./steps/StepShopPage";
import StepProductPage from "./steps/StepProductPage";
import StepAdditionalPages from "./steps/StepAdditionalPages";
import StepEnvVars from "./steps/StepEnvVars";
import StepSummary from "./steps/StepSummary";
import StepImportData from "./steps/StepImportData";
import StepSeedData from "./steps/StepSeedData";
import StepHosting from "./steps/StepHosting";
import { CheckIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import type { StepStatus } from "../wizard/schema";
import { cn } from "@ui/utils/style";
import { Tooltip } from "@/components/atoms";
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
    pillClass: "bg-info/10 text-info",
    accentClass: "bg-info",
  },
  experience: {
    label: "Experience",
    description: "Design how shoppers explore, interact, and fall in love with your products.",
    pillClass: "bg-accent/10 text-accent-foreground",
    accentClass: "bg-accent",
  },
  operations: {
    label: "Operations",
    description: "Wire up integrations, environments, and go-live readiness.",
    pillClass: "bg-warning/10 text-warning-foreground",
    accentClass: "bg-warning",
  },
  growth: {
    label: "Growth",
    description: "Optional boosters that accelerate content, experimentation, and scale.",
    pillClass: "bg-success/10 text-success-foreground",
    accentClass: "bg-success",
  },
};

const stepList: ConfiguratorStep[] = [
  {
    id: "shop-details",
    label: "Shop Details",
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
    track: "experience",
    component: StepTheme,
  },
  {
    id: "tokens",
    label: "Fonts and Colors",
    description: "Pick a font pairing and a color theme. Simple and fast.",
    icon: "🪄",
    track: "experience",
    component: StepTokens,
  },
  {
    id: "options",
    label: "Shop Options",
    description: "Enable core capabilities like fulfillment, pricing rules, and policies.",
    icon: "⚙️",
    track: "foundation",
    component: StepOptions,
  },
  {
    id: "navigation",
    label: "Navigation",
    description: "Design the primary navigation so shoppers always know where to go next.",
    icon: "🗺️",
    track: "experience",
    component: StepNavigation as unknown as React.ComponentType<ConfiguratorStepProps>,
  },
  {
    id: "layout",
    label: "Layout",
    description: "Compose responsive sections and scaffolding that power every page.",
    icon: "📐",
    track: "experience",
    component: StepLayout as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["navigation"],
  },
  {
    id: "home-page",
    label: "Home Page",
    description: "Showcase featured collections, hero content, and campaigns on your landing page.",
    icon: "🏠",
    track: "experience",
    component: StepHomePage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
  },
  {
    id: "checkout-page",
    label: "Checkout",
    description: "Craft a high-trust checkout flow with clear steps and reassuring details.",
    icon: "💳",
    track: "experience",
    component: StepCheckoutPage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
  },
  {
    id: "shop-page",
    label: "Catalog",
    description: "Curate filters, merchandising modules, and product discovery for your shop page.",
    icon: "🛍️",
    track: "experience",
    component: StepShopPage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
  },
  {
    id: "product-page",
    label: "Product Detail",
    description: "Tell the product story with galleries, feature highlights, and conversion tactics.",
    icon: "📄",
    track: "experience",
    component: StepProductPage as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["shop-page"],
  },
  {
    id: "additional-pages",
    label: "Content Pages",
    description: "Plan supporting content such as FAQ, About, and policy pages.",
    icon: "📚",
    track: "growth",
    component: StepAdditionalPages as unknown as React.ComponentType<ConfiguratorStepProps>,
    recommended: ["layout"],
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
    id: "summary",
    label: "Review & Publish",
    description: "Double-check every decision before handing the keys to your launch team.",
    icon: "🧾",
    track: "operations",
    component: StepSummary as unknown as React.ComponentType<ConfiguratorStepProps>,
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
    id: "seed-data",
    label: "Seed Demo Content",
    description: "Generate sample products and pages to test ideas before go-live.",
    icon: "🌱",
    track: "growth",
    component: StepSeedData as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
  },
  {
    id: "hosting",
    label: "Hosting & Delivery",
    description: "Choose deployment targets, edge regions, and performance presets.",
    icon: "🚀",
    track: "operations",
    component: StepHosting as unknown as React.ComponentType<ConfiguratorStepProps>,
    optional: true,
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
export function ConfiguratorProgress({
  currentStepId,
  completed,
}: ProgressProps) {
  const list = getSteps();
  const currentIdx = stepIndex[currentStepId] ?? 0;
  return (
    <ol className="flex items-center gap-4 text-sm">
      {list.map((s, idx) => {
        const status = completed[s.id] ?? "pending";
        const statusText =
          status === "complete"
            ? "Done"
            : status === "skipped"
              ? "Skipped"
              : "Pending";
        const isDisabled = idx > currentIdx;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <Tooltip text={statusText}>
              <Link
                href={`/cms/configurator/${s.id}`}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : undefined}
                className={cn(
                  "flex items-center gap-2",
                  isDisabled
                    ? "pointer-events-none cursor-default"
                    : "hover:underline"
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-content-center rounded-full border",
                    completed[s.id] === "complete" &&
                      "bg-primary border-primary text-primary-fg",
                    idx === currentIdx && "border-primary",
                    idx > currentIdx && "text-muted-foreground border-muted"
                  )}
                >
                  {completed[s.id] === "complete" ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span
                  className={cn(
                    idx === currentIdx && "font-medium",
                    isDisabled && "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </Link>
            </Tooltip>
            {idx < list.length - 1 && (
              <span className="border-muted ml-2 flex-1 border-t" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
