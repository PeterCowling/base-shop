// packages/ui/src/components/cms/page-builder/panels/layout/SizeControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Button } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import IconButton from "../../../../atoms/IconButton";
import UnitInput from "./UnitInput";
import useLocalStrings from "../../hooks/useLocalStrings";
import { isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  locked: boolean;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
  errorKeys?: Set<string>;
}

export default function SizeControls({ component, locked, handleResize, handleFullSize, errorKeys }: Props) {
  const t = useLocalStrings();
  const TOOLTIP_WIDTH = t("tooltip_width_hint");
  const TOOLTIP_HEIGHT = t("tooltip_height_hint");
  const PLACEHOLDER_WIDTH = t("placeholder_width");
  const PLACEHOLDER_HEIGHT = t("placeholder_height");
  const LABEL_OVERRIDE_ACTIVE = t("label_override_active");
  const LABEL_RESET = t("label_reset");
  const LABEL_FULL_WIDTH = t("label_full_width");
  const LABEL_FULL_HEIGHT = t("label_full_height");

  const cmp = component as Record<string, unknown>;
  return (
    <>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <UnitInput
            componentId={component.id}
            label={t("width_label_template", { vp: vp === "Desktop" ? t("device_desktop") : vp === "Tablet" ? t("device_tablet") : t("device_mobile") })}
            labelSuffix={
              <Tooltip text={TOOLTIP_WIDTH}>
                <IconButton aria-label={t("aria_explain_width_units")} size="md">?{/* i18n-exempt */}</IconButton>
              </Tooltip>
            }
            placeholder={PLACEHOLDER_WIDTH}
            value={(component[`width${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`width${vp}`, v)}
            axis="w"
            disabled={locked}
            cssProp="width"
            extraError={errorKeys?.has(`width${vp}`)}
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
            label={t("height_label_template", { vp: vp === "Desktop" ? t("device_desktop") : vp === "Tablet" ? t("device_tablet") : t("device_mobile") })}
            labelSuffix={
              <Tooltip text={TOOLTIP_HEIGHT}>
                <IconButton aria-label={t("aria_explain_height_units")} size="md">?{/* i18n-exempt */}</IconButton>
              </Tooltip>
            }
            placeholder={PLACEHOLDER_HEIGHT}
            value={(component[`height${vp}` as keyof PageComponent] as string) ?? ""}
            onChange={(v) => handleResize(`height${vp}`, v)}
            axis="h"
            disabled={locked}
            cssProp="height"
            extraError={errorKeys?.has(`height${vp}`)}
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
