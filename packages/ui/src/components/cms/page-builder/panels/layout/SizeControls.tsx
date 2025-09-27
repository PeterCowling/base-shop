// packages/ui/src/components/cms/page-builder/panels/layout/SizeControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Button } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import IconButton from "../../../../atoms/IconButton";
import UnitInput from "./UnitInput";
import { isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  locked: boolean;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
}

export default function SizeControls({ component, locked, handleResize, handleFullSize }: Props) {
  // i18n-exempt: Builder-only helper text and labels
  const TOOLTIP_WIDTH = "CSS width with unit (px/%/rem)"; // i18n-exempt: editor helper copy
  const TOOLTIP_HEIGHT = "CSS height with unit (px/%/rem)"; // i18n-exempt: editor helper copy
  const PLACEHOLDER_WIDTH = "e.g. 100px or 50%"; // i18n-exempt: example input, non-user copy
  const PLACEHOLDER_HEIGHT = "e.g. 1px or 1rem"; // i18n-exempt: example input, non-user copy
  const LABEL_OVERRIDE_ACTIVE = "Override active"; // i18n-exempt: builder status label
  const LABEL_RESET = "Reset"; // i18n-exempt: builder action label
  const LABEL_FULL_WIDTH = "Full width"; // i18n-exempt: builder action label
  const LABEL_FULL_HEIGHT = "Full height"; // i18n-exempt: builder action label

  const cmp = component as Record<string, unknown>;
  return (
    <>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <UnitInput
            componentId={component.id}
            label={
              <span className="flex items-center gap-1">
                {`Width (${vp})`}
                <Tooltip text={TOOLTIP_WIDTH}>
                  <IconButton aria-label="Explain width units" size="md">{/* i18n-exempt: accessibility label for builder */}?{/* i18n-exempt */}</IconButton>
                </Tooltip>
              </span>
            }
            placeholder={PLACEHOLDER_WIDTH}
            value={(component[`width${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`width${vp}`, v)}
            axis="w"
            disabled={locked}
            cssProp="width"
          />
          {isOverridden(cmp["width"], cmp[`width${vp}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">{LABEL_OVERRIDE_ACTIVE}</span>
              <button type="button" className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2" onClick={() => handleResize(`width${vp}`, "")}>
                {LABEL_RESET}
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={locked} onClick={() => handleFullSize(`width${vp}`)}>
              {LABEL_FULL_WIDTH}
            </Button>
          </div>
          <UnitInput
            componentId={component.id}
            label={
              <span className="flex items-center gap-1">
                {`Height (${vp})`}
                <Tooltip text={TOOLTIP_HEIGHT}>
                  <IconButton aria-label="Explain height units" size="md">{/* i18n-exempt: accessibility label for builder */}?{/* i18n-exempt */}</IconButton>
                </Tooltip>
              </span>
            }
            placeholder={PLACEHOLDER_HEIGHT}
            value={(component[`height${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`height${vp}`, v)}
            axis="h"
            disabled={locked}
            cssProp="height"
          />
          {isOverridden(cmp["height"], cmp[`height${vp}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">{LABEL_OVERRIDE_ACTIVE}</span>
              <button type="button" className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2" onClick={() => handleResize(`height${vp}`, "")}>
                {LABEL_RESET}
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={locked} onClick={() => handleFullSize(`height${vp}`)}>
              {LABEL_FULL_HEIGHT}
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}
