// packages/ui/src/components/cms/page-builder/EffectsEditor.tsx
"use client";

import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

import { Input } from "../../atoms/shadcn";
// i18n-exempt — Editor-only field labels
/* i18n-exempt */
const t = (s: string) => s;

interface Props {
  effects?: NonNullable<StyleOverrides["effects"]>;
  onChange: (key: keyof NonNullable<StyleOverrides["effects"]>, value: string) => void;
}

export default function EffectsEditor({ effects, onChange }: Props) {
  const fx = effects ?? {};
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input label={t("Border radius")} value={fx.borderRadius ?? ""} onChange={(e) => onChange("borderRadius", e.target.value)} />
      <Input label={t("Box shadow")} value={fx.boxShadow ?? ""} onChange={(e) => onChange("boxShadow", e.target.value)} />
      <Input label={t("Opacity")} value={fx.opacity ?? ""} onChange={(e) => onChange("opacity", e.target.value)} placeholder={t("0..1")} />
      <Input label={t("Backdrop filter")} value={fx.backdropFilter ?? ""} onChange={(e) => onChange("backdropFilter", e.target.value)} placeholder={t("e.g. blur(6px)")} />
      <Input label={t("Filter")} value={fx.filter ?? ""} onChange={(e) => onChange("filter", e.target.value)} placeholder={t("e.g. brightness(1) contrast(1.1)")} />
      <Input label={t("Outline")} value={fx.outline ?? ""} onChange={(e) => onChange("outline", e.target.value)} placeholder={t("e.g. 1px solid var(--color-border)")} />
      <Input label={t("Outline offset")} value={fx.outlineOffset ?? ""} onChange={(e) => onChange("outlineOffset", e.target.value)} />
      <Input label={t("Border top")} value={fx.borderTop ?? ""} onChange={(e) => onChange("borderTop", e.target.value)} />
      <Input label={t("Border right")} value={fx.borderRight ?? ""} onChange={(e) => onChange("borderRight", e.target.value)} />
      <Input label={t("Border bottom")} value={fx.borderBottom ?? ""} onChange={(e) => onChange("borderBottom", e.target.value)} />
      <Input label={t("Border left")} value={fx.borderLeft ?? ""} onChange={(e) => onChange("borderLeft", e.target.value)} />
      <Input label={t("Rotate")} value={fx.transformRotate ?? ""} onChange={(e) => onChange("transformRotate", e.target.value)} placeholder={t("e.g. 5deg")} />
      <Input label={t("Scale")} value={fx.transformScale ?? ""} onChange={(e) => onChange("transformScale", e.target.value)} placeholder={t("e.g. 1.05")} />
      <Input label={t("Skew X")} value={fx.transformSkewX ?? ""} onChange={(e) => onChange("transformSkewX", e.target.value)} placeholder={t("e.g. 5deg")} />
      <Input label={t("Skew Y")} value={fx.transformSkewY ?? ""} onChange={(e) => onChange("transformSkewY", e.target.value)} placeholder={t("e.g. 0deg")} />
    </div>
  );
}
