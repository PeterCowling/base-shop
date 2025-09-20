// packages/ui/src/components/cms/page-builder/style/effectPresets.ts
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

export type EffectPreset = { id: string; label: string; value: Partial<StyleOverrides> };

export const defaultEffectPresets: EffectPreset[] = [
  {
    id: "muted-card",
    label: "Muted card",
    value: {
      color: {
        bg: "hsl(var(--color-muted))",
        fg: "hsl(var(--color-muted-fg))",
        border: "hsl(var(--color-muted-border))",
      },
    },
  },
  {
    id: "primary-button",
    label: "Primary button",
    value: {
      color: {
        bg: "hsl(var(--color-primary))",
        fg: "hsl(var(--color-primary-fg))",
        border: "hsl(var(--color-primary))",
      },
      typography: { fontWeight: "600" },
    },
  },
  {
    id: "card-soft-shadow",
    label: "Card · Soft shadow",
    value: {
      effects: {
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      },
    },
  },
  {
    id: "glass-blur",
    label: "Glass · Blur",
    value: {
      effects: {
        borderRadius: "16px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        backdropFilter: "blur(10px) saturate(1.1)",
        borderTop: "1px solid rgba(255,255,255,0.24)",
        borderRight: "1px solid rgba(255,255,255,0.24)",
        borderBottom: "1px solid rgba(255,255,255,0.24)",
        borderLeft: "1px solid rgba(255,255,255,0.24)",
      },
    },
  },
  {
    id: "elevated-card",
    label: "Card · Elevated",
    value: {
      effects: {
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.16)",
      },
    },
  },
  {
    id: "inset-panel",
    label: "Panel · Inset",
    value: {
      effects: {
        borderRadius: "var(--radius-lg)",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)",
      },
    },
  },
  {
    id: "outline-card",
    label: "Card · Outline",
    value: {
      effects: {
        borderRadius: "var(--radius-lg)",
        borderTop: "1px solid rgba(0,0,0,0.12)",
        borderRight: "1px solid rgba(0,0,0,0.12)",
        borderBottom: "1px solid rgba(0,0,0,0.12)",
        borderLeft: "1px solid rgba(0,0,0,0.12)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      },
    },
  },
  {
    id: "floating-pill",
    label: "Pill · Floating",
    value: {
      effects: {
        borderRadius: "9999px",
        boxShadow: "0 10px 28px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  {
    id: "subtle-divider",
    label: "Divider · Subtle",
    value: {
      effects: {
        borderBottom: "1px solid rgba(0,0,0,0.08)",
      },
    },
  },
  {
    id: "card-shadowless",
    label: "Card · Shadowless",
    value: {
      effects: {
        borderRadius: "var(--radius-lg)",
        boxShadow: "none",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        borderRight: "1px solid rgba(0,0,0,0.08)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        borderLeft: "1px solid rgba(0,0,0,0.08)",
      },
    },
  },
  {
    id: "card-neumorphic",
    label: "Card · Neumorphic",
    value: {
      effects: {
        borderRadius: "16px",
        boxShadow:
          "8px 8px 16px rgba(0,0,0,0.10), -8px -8px 16px rgba(255,255,255,0.65)",
      },
    },
  },
  {
    id: "card-raised-outline",
    label: "Card · Raised outline",
    value: {
      effects: {
        borderRadius: "var(--radius-lg)",
        borderTop: "1px solid rgba(0,0,0,0.10)",
        borderRight: "1px solid rgba(0,0,0,0.10)",
        borderBottom: "1px solid rgba(0,0,0,0.10)",
        borderLeft: "1px solid rgba(0,0,0,0.10)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      },
    },
  },
];

