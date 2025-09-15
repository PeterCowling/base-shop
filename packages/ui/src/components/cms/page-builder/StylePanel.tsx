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
      {warning && (
        <p role="status" aria-live="polite" className="text-danger text-sm">
          {t("cms.style.lowContrast")}
        </p>
      )}
    </div>
  );
}
