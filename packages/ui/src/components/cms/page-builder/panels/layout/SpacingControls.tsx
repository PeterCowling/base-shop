// packages/ui/src/components/cms/page-builder/panels/layout/SpacingControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import IconButton from "../../../../atoms/IconButton";
import { cssError, isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
  handleResize: (field: string, value: string) => void;
  errorKeys?: Set<string>;
}

export default function SpacingControls({ component, handleInput, handleResize, errorKeys }: Props) {
  const t = useTranslations();
  const LABEL_MARGIN = t("cms.builder.spacing.margin");
  const LABEL_PADDING = t("cms.builder.spacing.padding");
  const LABEL_GAP = t("cms.builder.spacing.gap");
  const TIP_MARGIN = t("cms.builder.spacing.tips.margin");
  const TIP_PADDING = t("cms.builder.spacing.tips.padding");
  const TIP_MARGIN_GLOBAL = t("cms.builder.spacing.tips.marginGlobal");
  const TIP_PADDING_GLOBAL = t("cms.builder.spacing.tips.paddingGlobal");
  const TIP_GAP = t("cms.builder.spacing.tips.gap");
  const PLACEHOLDER_REM = t("cms.builder.spacing.placeholder.rem");

  const cmp = component as Record<string, unknown>;
  return (
    <>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={`spacing-${vp}`} className="space-y-2">
          <Input
            label={`${LABEL_MARGIN} (${vp})`}
            placeholder={PLACEHOLDER_REM}
            value={(component[`margin${vp}` as keyof PageComponent] as string) ?? ""}
            error={cssError("margin", component[`margin${vp}` as keyof PageComponent] as string) ?? (errorKeys?.has(`margin${vp}`) ? "Invalid margin value" : undefined)}
            onChange={(e) => handleResize(`margin${vp}`, e.target.value)}
          />
          {isOverridden(cmp["margin"], cmp[`margin${vp}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">{t("cms.builder.override.activeTag")}</span>
              <button
                type="button"
                className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2"
                onClick={() => handleResize(`margin${vp}`, "")}
              >
                {t("actions.reset")}
              </button>
            </div>
          )}
          <Input
            label={`${LABEL_PADDING} (${vp})`}
            placeholder={PLACEHOLDER_REM}
            value={(component[`padding${vp}` as keyof PageComponent] as string) ?? ""}
            error={cssError("padding", component[`padding${vp}` as keyof PageComponent] as string) ?? (errorKeys?.has(`padding${vp}`) ? "Invalid padding value" : undefined)}
            onChange={(e) => handleResize(`padding${vp}`, e.target.value)}
          />
          {isOverridden(cmp["padding"], cmp[`padding${vp}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">{t("cms.builder.override.activeTag")}</span>
              <button
                type="button"
                className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2"
                onClick={() => handleResize(`padding${vp}`, "")}
              >
                {t("actions.reset")}
              </button>
            </div>
          )}
        </div>
      ))}
      <Input
        label={LABEL_MARGIN}
        placeholder={PLACEHOLDER_REM}
        value={component.margin ?? ""}
        error={cssError("margin", component.margin) ?? (errorKeys?.has("margin") ? "Invalid margin value" : undefined)}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label={LABEL_PADDING}
        placeholder={PLACEHOLDER_REM}
        value={component.padding ?? ""}
        error={cssError("padding", component.padding) ?? (errorKeys?.has("padding") ? "Invalid padding value" : undefined)}
        onChange={(e) => handleInput("padding", e.target.value)}
      />
      {"gap" in component && (
        <Input
          label={LABEL_GAP}
          placeholder={PLACEHOLDER_REM}
          value={(component as { gap?: string }).gap ?? ""}
          error={cssError("gap", (component as { gap?: string }).gap)}
          onChange={(e) => handleInput("gap", e.target.value)}
        />
      )}
    </>
  );
}
