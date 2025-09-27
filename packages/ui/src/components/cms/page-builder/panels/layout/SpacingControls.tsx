// packages/ui/src/components/cms/page-builder/panels/layout/SpacingControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import IconButton from "../../../../atoms/IconButton";
import { cssError, isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
  handleResize: (field: string, value: string) => void;
}

export default function SpacingControls({ component, handleInput, handleResize }: Props) {
  // i18n-exempt: Builder-only helper text and labels
  const LABEL_MARGIN = "Margin"; // i18n-exempt: builder label
  const LABEL_PADDING = "Padding"; // i18n-exempt: builder label
  const LABEL_GAP = "Gap"; // i18n-exempt: builder label
  const TIP_MARGIN = "CSS margin value with units"; // i18n-exempt: helper copy
  const TIP_PADDING = "CSS padding value with units"; // i18n-exempt: helper copy
  const TIP_MARGIN_GLOBAL = "Global CSS margin value with units"; // i18n-exempt
  const TIP_PADDING_GLOBAL = "Global CSS padding value with units"; // i18n-exempt
  const TIP_GAP = "Gap between items"; // i18n-exempt: helper copy
  const PLACEHOLDER_REM = "e.g. 1rem"; // i18n-exempt: example input

  const cmp = component as Record<string, unknown>;
  return (
    <>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={`spacing-${vp}`} className="space-y-2">
          <Input
            label={
              <span className="flex items-center gap-1">
                {`${LABEL_MARGIN} (${vp})`}
                <Tooltip text={TIP_MARGIN}>
                  <IconButton aria-label="Explain margin units" size="md">{/* i18n-exempt */}?{/* i18n-exempt */}</IconButton>
                </Tooltip>
              </span>
            }
            placeholder={PLACEHOLDER_REM}
            value={(component[`margin${vp}` as keyof PageComponent] as string) ?? ""}
            error={cssError("margin", component[`margin${vp}` as keyof PageComponent] as string)}
            onChange={(e) => handleResize(`margin${vp}`, e.target.value)}
          />
          {isOverridden(cmp["margin"], cmp[`margin${vp}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span> {/* i18n-exempt */}
              <button
                type="button"
                className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2"
                onClick={() => handleResize(`margin${vp}`, "")}
              >
                Reset {/* i18n-exempt */}
              </button>
            </div>
          )}
          <Input
            label={
              <span className="flex items-center gap-1">
                {`${LABEL_PADDING} (${vp})`}
                <Tooltip text={TIP_PADDING}>
                  <IconButton aria-label="Explain padding units" size="md">{/* i18n-exempt */}?{/* i18n-exempt */}</IconButton>
                </Tooltip>
              </span>
            }
            placeholder={PLACEHOLDER_REM}
            value={(component[`padding${vp}` as keyof PageComponent] as string) ?? ""}
            error={cssError("padding", component[`padding${vp}` as keyof PageComponent] as string)}
            onChange={(e) => handleResize(`padding${vp}`, e.target.value)}
          />
          {isOverridden(cmp["padding"], cmp[`padding${vp}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span> {/* i18n-exempt */}
              <button
                type="button"
                className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2"
                onClick={() => handleResize(`padding${vp}`, "")}
              >
                Reset {/* i18n-exempt */}
              </button>
            </div>
          )}
        </div>
      ))}
      <Input
        label={
          <span className="flex items-center gap-1">
            {LABEL_MARGIN}
            <Tooltip text={TIP_MARGIN_GLOBAL}>
              <IconButton aria-label="Explain global margin" size="md">{/* i18n-exempt */}?{/* i18n-exempt */}</IconButton>
            </Tooltip>
          </span>
        }
        placeholder={PLACEHOLDER_REM}
        value={component.margin ?? ""}
        error={cssError("margin", component.margin)}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label={
          <span className="flex items-center gap-1">
            {LABEL_PADDING}
            <Tooltip text={TIP_PADDING_GLOBAL}>
              <IconButton aria-label="Explain global padding" size="md">{/* i18n-exempt */}?{/* i18n-exempt */}</IconButton>
            </Tooltip>
          </span>
        }
        placeholder={PLACEHOLDER_REM}
        value={component.padding ?? ""}
        error={cssError("padding", component.padding)}
        onChange={(e) => handleInput("padding", e.target.value)}
      />
      {"gap" in component && (
        <Input
          label={
            <span className="flex items-center gap-1">
              {LABEL_GAP}
              <Tooltip text={TIP_GAP}>
                <IconButton aria-label="Explain gap" size="md">{/* i18n-exempt */}?{/* i18n-exempt */}</IconButton>
              </Tooltip>
            </span>
          }
          placeholder={PLACEHOLDER_REM}
          value={(component as { gap?: string }).gap ?? ""}
          error={cssError("gap", (component as { gap?: string }).gap)}
          onChange={(e) => handleInput("gap", e.target.value)}
        />
      )}
    </>
  );
}
