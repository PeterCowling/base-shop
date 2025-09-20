// packages/ui/src/components/cms/page-builder/StylePanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { Input } from "../../atoms/shadcn";
import { useTranslations } from "@acme/i18n";
import useContrastWarnings from "../../../hooks/useContrastWarnings";

type TrackFn = (name: string, payload?: Record<string, unknown>) => void;
let track: TrackFn = () => {};

import("@acme/telemetry")
  .then((m) => {
    track = m.track;
  })
  .catch(() => {
    // telemetry is optional in tests
  });

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K]
  ) => void;
}

export default function StylePanel({ component, handleInput }: Props) {
  const overrides: StyleOverrides = component.styles
    ? JSON.parse(String(component.styles))
    : {};
  const color = overrides.color ?? {};
  const typography = overrides.typography ?? {};
  const typoDesktop = overrides.typographyDesktop ?? {};
  const typoTablet = overrides.typographyTablet ?? {};
  const typoMobile = overrides.typographyMobile ?? {};
  const warning = useContrastWarnings(color.fg ?? "", color.bg ?? "");
  const t = useTranslations();

  const update = (group: "color" | "typography", key: string, value: string) => {
    const next: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
    };
    if (group === "color") {
      next.color = { ...color, [key]: value };
    } else {
      next.typography = { ...typography, [key]: value };
    }
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:update", { group, key });
  };

  const updateBp = (
    bp: "Desktop" | "Tablet" | "Mobile",
    key: "fontSize" | "lineHeight",
    value: string,
  ) => {
    const next: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
      typographyDesktop: { ...typoDesktop },
      typographyTablet: { ...typoTablet },
      typographyMobile: { ...typoMobile },
    };
    const field = `typography${bp}` as const;
    (next as any)[field] = { ...(next as any)[field], [key]: value };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:update", { group: `typography-${bp.toLowerCase()}` as string, key });
  };

  return (
    <div className="space-y-2">
      <Input
        label={t("cms.style.foreground")}
        value={color.fg ?? ""}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(e) => update("color", "fg", e.target.value)}
      />
      <Input
        label={t("cms.style.background")}
        value={color.bg ?? ""}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(e) => update("color", "bg", e.target.value)}
      />
      <Input
        label={t("cms.style.border")}
        value={color.border ?? ""}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(e) => update("color", "border", e.target.value)}
      />
      <Input
        label={t("cms.style.fontFamily")}
        value={typography.fontFamily ?? ""}
        onChange={(e) => update("typography", "fontFamily", e.target.value)}
      />
      <Input
        label={t("cms.style.fontSize")}
        value={typography.fontSize ?? ""}
        onChange={(e) => update("typography", "fontSize", e.target.value)}
      />
      <Input
        label={t("cms.style.fontWeight")}
        value={typography.fontWeight ?? ""}
        onChange={(e) => update("typography", "fontWeight", e.target.value)}
      />
      <Input
        label={t("cms.style.lineHeight")}
        value={typography.lineHeight ?? ""}
        onChange={(e) => update("typography", "lineHeight", e.target.value)}
      />
      {/* Per-breakpoint typography overrides */}
      <div className="mt-3 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Typography (Desktop)</div>
        <Input
          label="Font size (Desktop)"
          value={typoDesktop.fontSize ?? ""}
          onChange={(e) => updateBp("Desktop", "fontSize", e.target.value)}
        />
        <Input
          label="Line height (Desktop)"
          value={typoDesktop.lineHeight ?? ""}
          onChange={(e) => updateBp("Desktop", "lineHeight", e.target.value)}
        />
      </div>
      <div className="border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Typography (Tablet)</div>
        <Input
          label="Font size (Tablet)"
          value={typoTablet.fontSize ?? ""}
          onChange={(e) => updateBp("Tablet", "fontSize", e.target.value)}
        />
        <Input
          label="Line height (Tablet)"
          value={typoTablet.lineHeight ?? ""}
          onChange={(e) => updateBp("Tablet", "lineHeight", e.target.value)}
        />
      </div>
      <div className="border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Typography (Mobile)</div>
        <Input
          label="Font size (Mobile)"
          value={typoMobile.fontSize ?? ""}
          onChange={(e) => updateBp("Mobile", "fontSize", e.target.value)}
        />
        <Input
          label="Line height (Mobile)"
          value={typoMobile.lineHeight ?? ""}
          onChange={(e) => updateBp("Mobile", "lineHeight", e.target.value)}
        />
      </div>
      {warning && (
        <p role="status" aria-live="polite" className="text-danger text-sm">
          {t("cms.style.lowContrast")}
        </p>
      )}
    </div>
  );
}
