// packages/ui/src/components/cms/page-builder/panels/content/ColumnsControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";
import type { ContentComponent, HandleInput } from "./types";
import { isOverridden, nonNegative } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function ColumnsControls({ component, handleInput }: Props) {
  const t = useTranslations();
  if (!("columns" in component)) return null;

  const comp = component as ContentComponent;

  // Bridge to allow setting fields defined on ContentComponent
  // while keeping the incoming handler typed to PageComponent keys.
  const setField = <K extends keyof ContentComponent>(
    field: K,
    value: ContentComponent[K],
  ) => {
    // Cast through unknown to avoid explicit any usage
    handleInput(
      field as unknown as keyof PageComponent,
      value as unknown as PageComponent[keyof PageComponent],
    );
  };

  const columnsError =
    nonNegative(comp.columns) ||
    (comp.columns !== undefined &&
    ((comp.minItems !== undefined && comp.columns < comp.minItems) ||
      (comp.maxItems !== undefined && comp.columns > comp.maxItems))
      ? t("Columns must be between min and max items")
      : undefined);

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          label={t("Columns")}
          type="number"
          value={comp.columns ?? ""}
          onChange={(e) =>
            setField(
              "columns",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          min={comp.minItems}
          max={comp.maxItems}
          error={columnsError}
        />
        <Tooltip text={t("Number of columns")}>?</Tooltip>
      </div>

      <div className="flex items-center gap-1">
        <Input
          label={t("Columns (Desktop)")}
          type="number"
          value={comp.columnsDesktop ?? ""}
          onChange={(e) =>
            setField(
              "columnsDesktop",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          min={comp.minItems}
          max={comp.maxItems}
        />
        <Tooltip text={t("Columns on desktop")}>?</Tooltip>
      </div>
      {isOverridden(comp.columns, comp.columnsDesktop) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("columnsDesktop", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label={t("Columns (Tablet)")}
          type="number"
          value={comp.columnsTablet ?? ""}
          onChange={(e) =>
            setField(
              "columnsTablet",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          min={0}
        />
        <Tooltip text={t("Columns on tablet")}>?</Tooltip>
      </div>
      {isOverridden(comp.columns, comp.columnsTablet) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("columnsTablet", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label={t("Columns (Mobile)")}
          type="number"
          value={comp.columnsMobile ?? ""}
          onChange={(e) =>
            setField(
              "columnsMobile",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          min={0}
        />
        <Tooltip text={t("Columns on mobile")}>?</Tooltip>
      </div>
      {isOverridden(comp.columns, comp.columnsMobile) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("columnsMobile", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}
    </>
  );
}
