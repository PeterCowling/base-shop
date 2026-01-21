// packages/ui/src/components/cms/page-builder/panels/layout/SpacingControls.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Input } from "@acme/design-system/shadcn";

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
  const ERROR_MARGIN_INVALID = t("cms.builder.spacing.error.invalidMargin");
  const ERROR_PADDING_INVALID = t("cms.builder.spacing.error.invalidPadding");
  const PLACEHOLDER_REM = t("cms.builder.spacing.placeholder.rem");

  const cmp = component as Record<string, unknown>;
  const VIEWPORTS = [
    { suffix: "Desktop", label: t("cms.builder.spacing.viewport.desktop") },
    { suffix: "Tablet", label: t("cms.builder.spacing.viewport.tablet") },
    { suffix: "Mobile", label: t("cms.builder.spacing.viewport.mobile") },
  ] as const;

  return (
    <>
      {VIEWPORTS.map(({ suffix, label }) => (
        <div key={`spacing-${suffix}`} className="space-y-2">
          <Input
            label={`${LABEL_MARGIN} (${label})`}
            placeholder={PLACEHOLDER_REM}
            value={(component[`margin${suffix}` as keyof PageComponent] as string) ?? ""}
            error={
              cssError("margin", component[`margin${suffix}` as keyof PageComponent] as string) ??
              (errorKeys?.has(`margin${suffix}`) ? ERROR_MARGIN_INVALID : undefined)
            }
            onChange={(e) => handleResize(`margin${suffix}`, e.target.value)}
          />
          {isOverridden(cmp["margin"], cmp[`margin${suffix}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-muted px-1 text-primary">{t("cms.builder.override.activeTag")}</span>
              <button
                type="button"
                className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2"
                onClick={() => handleResize(`margin${suffix}`, "")}
              >
                {t("actions.reset")}
              </button>
            </div>
          )}
          <Input
            label={`${LABEL_PADDING} (${label})`}
            placeholder={PLACEHOLDER_REM}
            value={(component[`padding${suffix}` as keyof PageComponent] as string) ?? ""}
            error={
              cssError("padding", component[`padding${suffix}` as keyof PageComponent] as string) ??
              (errorKeys?.has(`padding${suffix}`) ? ERROR_PADDING_INVALID : undefined)
            }
            onChange={(e) => handleResize(`padding${suffix}`, e.target.value)}
          />
          {isOverridden(cmp["padding"], cmp[`padding${suffix}`]) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-muted px-1 text-primary">{t("cms.builder.override.activeTag")}</span>
              <button
                type="button"
                className="underline inline-flex items-center justify-center min-h-10 min-w-10 px-2"
                onClick={() => handleResize(`padding${suffix}`, "")}
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
        error={cssError("margin", component.margin) ?? (errorKeys?.has("margin") ? ERROR_MARGIN_INVALID : undefined)}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label={LABEL_PADDING}
        placeholder={PLACEHOLDER_REM}
        value={component.padding ?? ""}
        error={cssError("padding", component.padding) ?? (errorKeys?.has("padding") ? ERROR_PADDING_INVALID : undefined)}
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
