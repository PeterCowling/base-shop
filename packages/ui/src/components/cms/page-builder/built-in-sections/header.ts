import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";
import type { BuiltInSection } from "./types";
/**
 * Returns translated Header section variants using translation keys.
 */
export function getHeaderVariants(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:HeaderSection:minimal",
      label: t("pb.sections.HeaderSection.minimal.label"),
      description: t("pb.sections.HeaderSection.minimal.description"),
      preview: "/window.svg",
      previewType: "HeaderSection:minimal",
      build: () => ({ id: ulid(), type: "HeaderSection", variant: "minimal", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
    },
    {
      id: "builtin:HeaderSection:centerLogo",
      label: t("pb.sections.HeaderSection.centerLogo.label"),
      description: t("pb.sections.HeaderSection.centerLogo.description"),
      preview: "/window.svg",
      previewType: "HeaderSection:centerLogo",
      build: () => ({ id: ulid(), type: "HeaderSection", variant: "centerLogo", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
    },
    {
      id: "builtin:HeaderSection:splitUtilities",
      label: t("pb.sections.HeaderSection.splitUtilities.label"),
      description: t("pb.sections.HeaderSection.splitUtilities.description"),
      preview: "/window.svg",
      previewType: "HeaderSection:splitUtilities",
      build: () => ({ id: ulid(), type: "HeaderSection", variant: "splitUtilities", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
    },
    {
      id: "builtin:HeaderSection:transparent",
      label: t("pb.sections.HeaderSection.transparent.label"),
      description: t("pb.sections.HeaderSection.transparent.description"),
      preview: "/window.svg",
      previewType: "HeaderSection:transparent",
      build: () => ({ id: ulid(), type: "HeaderSection", variant: "transparent", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
    },
    {
      id: "builtin:HeaderSection:sticky",
      label: t("pb.sections.HeaderSection.sticky.label"),
      description: t("pb.sections.HeaderSection.sticky.description"),
      preview: "/window.svg",
      previewType: "HeaderSection:sticky",
      build: () => ({ id: ulid(), type: "HeaderSection", variant: "sticky", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
    },
  ];
}
