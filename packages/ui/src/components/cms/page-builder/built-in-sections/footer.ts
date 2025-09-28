import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";
import type { BuiltInSection } from "./types";
/**
 * Returns translated Footer section variants using translation keys.
 */
export function getFooterVariants(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:FooterSection:simple",
      label: t("pb.sections.FooterSection.simple.label"),
      description: t("pb.sections.FooterSection.simple.description"),
      preview: "/window.svg",
      previewType: "FooterSection:simple",
      build: () => ({ id: ulid(), type: "FooterSection", variant: "simple" } satisfies PageComponent),
    },
    {
      id: "builtin:FooterSection:multiColumn",
      label: t("pb.sections.FooterSection.multiColumn.label"),
      description: t("pb.sections.FooterSection.multiColumn.description"),
      preview: "/window.svg",
      previewType: "FooterSection:multiColumn",
      build: () => ({ id: ulid(), type: "FooterSection", variant: "multiColumn" } satisfies PageComponent),
    },
    {
      id: "builtin:FooterSection:newsletter",
      label: t("pb.sections.FooterSection.newsletter.label"),
      description: t("pb.sections.FooterSection.newsletter.description"),
      preview: "/window.svg",
      previewType: "FooterSection:newsletter",
      build: () => ({ id: ulid(), type: "FooterSection", variant: "newsletter" } satisfies PageComponent),
    },
    {
      id: "builtin:FooterSection:social",
      label: t("pb.sections.FooterSection.social.label"),
      description: t("pb.sections.FooterSection.social.description"),
      preview: "/window.svg",
      previewType: "FooterSection:social",
      build: () => ({ id: ulid(), type: "FooterSection", variant: "social" } satisfies PageComponent),
    },
    {
      id: "builtin:FooterSection:legalHeavy",
      label: t("pb.sections.FooterSection.legalHeavy.label"),
      description: t("pb.sections.FooterSection.legalHeavy.description"),
      preview: "/window.svg",
      previewType: "FooterSection:legalHeavy",
      build: () => ({ id: ulid(), type: "FooterSection", variant: "legalHeavy" } satisfies PageComponent),
    },
  ];
}
