// packages/ui/src/components/cms/page-builder/panels/content/MinMaxItems.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { ContentComponent, HandleInput, OnChange } from "./types";
import { nonNegative } from "./helpers";

interface Props {
  component: PageComponent;
  onChange: OnChange;
  handleInput: HandleInput;
}

export default function MinMaxItems({ component, onChange, handleInput }: Props) {
  const t = useTranslations();
  if (!("minItems" in component || "maxItems" in component)) return null;

  const comp = component as ContentComponent;

  const minItemsError =
    nonNegative(comp.minItems) ||
    (comp.minItems !== undefined &&
    comp.maxItems !== undefined &&
    comp.minItems > comp.maxItems
      ? t("cms.builder.items.min.exceedsMax")
      : undefined);

  const maxItemsError =
    nonNegative(comp.maxItems) ||
    (comp.minItems !== undefined &&
    comp.maxItems !== undefined &&
    comp.maxItems < comp.minItems
      ? t("cms.builder.items.max.lessThanMin")
      : undefined);

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          label={t("cms.builder.items.min.label")}
          type="number"
          value={comp.minItems ?? ""}
          onChange={(e) => {
            const val = e.target.value === "" ? undefined : Number(e.target.value);
            if (val === undefined) {
              (handleInput as unknown as (f: string, v: unknown) => void)("minItems", undefined);
              return;
            }
            const max = comp.maxItems;
            const patch: Partial<PageComponent> = { minItems: val };
            if (max !== undefined && val > max) {
              patch.maxItems = val;
            }
            onChange(patch);
          }}
          min={0}
          max={comp.maxItems ?? undefined}
          error={minItemsError}
        />
        <Tooltip text={t("cms.builder.items.min.tooltip")}>
          <span className="inline-flex items-center justify-center size-10">?</span>
        </Tooltip>
      </div>

      <div className="flex items-center gap-1">
        <Input
          label={t("cms.builder.items.max.label")}
          type="number"
          value={comp.maxItems ?? ""}
          onChange={(e) => {
            const val = e.target.value === "" ? undefined : Number(e.target.value);
            if (val === undefined) {
              (handleInput as unknown as (f: string, v: unknown) => void)("maxItems", undefined);
              return;
            }
            const min = comp.minItems;
            const patch: Partial<PageComponent> = { maxItems: val };
            if (min !== undefined && val < min) {
              patch.minItems = val;
            }
            onChange(patch);
          }}
          min={comp.minItems ?? 0}
          error={maxItemsError}
        />
        <Tooltip text={t("cms.builder.items.max.tooltip")}>
          <span className="inline-flex items-center justify-center size-10">?</span>
        </Tooltip>
      </div>
    </>
  );
}
