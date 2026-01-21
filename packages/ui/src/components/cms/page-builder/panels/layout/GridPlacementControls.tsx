// packages/ui/src/components/cms/page-builder/panels/layout/GridPlacementControls.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Tooltip } from "../../../../atoms";
import { Input } from "../../../../atoms/shadcn";

import { cssError } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function GridPlacementControls({ component, handleInput }: Props) {
  const t = useTranslations();
  return (
    <div className="mt-2 border-t pt-2">
      <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("cms.builder.layout.gridPlacement.title")}</div>
      <Input
        label={
          <span className="flex items-center gap-1">
            {t("cms.builder.layout.gridArea.label")}
            <Tooltip text={t("cms.builder.layout.gridArea.tooltip") as string}>?</Tooltip>
          </span>
        }
        placeholder={t("cms.builder.layout.gridArea.placeholder") as string}
        value={(component as Record<string, unknown>)["gridArea"] as string | undefined ?? ""}
        error={cssError("grid-area", (component as Record<string, unknown>)["gridArea"] as string | undefined)}
        onChange={(e) =>
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "gridArea",
            (e.target.value || undefined) as unknown,
          )
        }
      />
      <Input
        label={
          <span className="flex items-center gap-1">
            {t("cms.builder.layout.gridColumn.label")}
            <Tooltip text={t("cms.builder.layout.gridColumn.tooltip") as string}>?</Tooltip>
          </span>
        }
        placeholder={t("cms.builder.layout.gridColumn.placeholder") as string}
        value={(component as Record<string, unknown>)["gridColumn"] as string | undefined ?? ""}
        error={cssError("grid-column", (component as Record<string, unknown>)["gridColumn"] as string | undefined)}
        onChange={(e) =>
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "gridColumn",
            (e.target.value || undefined) as unknown,
          )
        }
      />
      <Input
        label={
          <span className="flex items-center gap-1">
            {t("cms.builder.layout.gridRow.label")}
            <Tooltip text={t("cms.builder.layout.gridRow.tooltip") as string}>?</Tooltip>
          </span>
        }
        placeholder={t("cms.builder.layout.gridRow.placeholder") as string}
        value={(component as Record<string, unknown>)["gridRow"] as string | undefined ?? ""}
        error={cssError("grid-row", (component as Record<string, unknown>)["gridRow"] as string | undefined)}
        onChange={(e) =>
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "gridRow",
            (e.target.value || undefined) as unknown,
          )
        }
      />
    </div>
  );
}
