// packages/ui/src/components/cms/page-builder/StylePanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import type { StyleOverrides } from "../../../../../types/src/style/StyleOverrides";
import { Input } from "../../atoms/shadcn";
import useContrastWarnings from "../../../hooks/useContrastWarnings";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K]
  ) => void;
}

export default function StylePanel({ component, handleInput }: Props) {
  const overrides: StyleOverrides = component.styles
    ? JSON.parse(component.styles)
    : {};
  const color = overrides.color ?? {};
  const typography = overrides.typography ?? {};
  const warning = color.fg && color.bg ? useContrastWarnings(color.fg, color.bg) : null;

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
  };

  return (
    <div className="space-y-2">
      <Input
        label="Foreground"
        value={color.fg ?? ""}
        placeholder="token or #hex"
        onChange={(e) => update("color", "fg", e.target.value)}
      />
      <Input
        label="Background"
        value={color.bg ?? ""}
        placeholder="token or #hex"
        onChange={(e) => update("color", "bg", e.target.value)}
      />
      <Input
        label="Border"
        value={color.border ?? ""}
        placeholder="token or #hex"
        onChange={(e) => update("color", "border", e.target.value)}
      />
      <Input
        label="Font Family"
        value={typography.fontFamily ?? ""}
        onChange={(e) => update("typography", "fontFamily", e.target.value)}
      />
      <Input
        label="Font Size"
        value={typography.fontSize ?? ""}
        onChange={(e) => update("typography", "fontSize", e.target.value)}
      />
      <Input
        label="Font Weight"
        value={typography.fontWeight ?? ""}
        onChange={(e) => update("typography", "fontWeight", e.target.value)}
      />
      <Input
        label="Line Height"
        value={typography.lineHeight ?? ""}
        onChange={(e) => update("typography", "lineHeight", e.target.value)}
      />
      {warning && (
        <p role="alert" aria-live="polite" className="text-danger text-sm">
          Low contrast
        </p>
      )}
    </div>
  );
}
