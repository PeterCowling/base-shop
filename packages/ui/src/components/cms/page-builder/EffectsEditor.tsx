// packages/ui/src/components/cms/page-builder/EffectsEditor.tsx
"use client";

import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { Input } from "../../atoms/shadcn";

interface Props {
  effects?: NonNullable<StyleOverrides["effects"]>;
  onChange: (key: keyof NonNullable<StyleOverrides["effects"]>, value: string) => void;
}

export default function EffectsEditor({ effects, onChange }: Props) {
  const fx = effects ?? {};
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input label="Border radius" value={fx.borderRadius ?? ""} onChange={(e) => onChange("borderRadius", e.target.value)} />
      <Input label="Box shadow" value={fx.boxShadow ?? ""} onChange={(e) => onChange("boxShadow", e.target.value)} />
      <Input label="Opacity" value={fx.opacity ?? ""} onChange={(e) => onChange("opacity", e.target.value)} placeholder="0..1" />
      <Input label="Backdrop filter" value={fx.backdropFilter ?? ""} onChange={(e) => onChange("backdropFilter", e.target.value)} placeholder="e.g. blur(6px)" />
      <Input label="Filter" value={(fx as any).filter ?? ""} onChange={(e) => onChange("filter" as any, e.target.value)} placeholder="e.g. brightness(1) contrast(1.1)" />
      <Input label="Outline" value={fx.outline ?? ""} onChange={(e) => onChange("outline", e.target.value)} placeholder="e.g. 1px solid var(--color-border)" />
      <Input label="Outline offset" value={fx.outlineOffset ?? ""} onChange={(e) => onChange("outlineOffset", e.target.value)} />
      <Input label="Border top" value={fx.borderTop ?? ""} onChange={(e) => onChange("borderTop", e.target.value)} />
      <Input label="Border right" value={fx.borderRight ?? ""} onChange={(e) => onChange("borderRight", e.target.value)} />
      <Input label="Border bottom" value={fx.borderBottom ?? ""} onChange={(e) => onChange("borderBottom", e.target.value)} />
      <Input label="Border left" value={fx.borderLeft ?? ""} onChange={(e) => onChange("borderLeft", e.target.value)} />
      <Input label="Rotate" value={fx.transformRotate ?? ""} onChange={(e) => onChange("transformRotate", e.target.value)} placeholder="e.g. 5deg" />
      <Input label="Scale" value={fx.transformScale ?? ""} onChange={(e) => onChange("transformScale", e.target.value)} placeholder="e.g. 1.05" />
      <Input label="Skew X" value={fx.transformSkewX ?? ""} onChange={(e) => onChange("transformSkewX", e.target.value)} placeholder="e.g. 5deg" />
      <Input label="Skew Y" value={fx.transformSkewY ?? ""} onChange={(e) => onChange("transformSkewY", e.target.value)} placeholder="e.g. 0deg" />
    </div>
  );
}
