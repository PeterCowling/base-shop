export type BackgroundKey = "app" | "canvas" | "dark";

export type BackgroundOption = { name: string; value: string };

export type BackgroundOptions = Record<BackgroundKey, BackgroundOption>;

export const DEFAULT_BACKGROUND: BackgroundKey = "app";

export const createBackgroundOptions = (
  t: (key: string) => string
): BackgroundOptions => ({
  app: { name: t("storybook.backgrounds.app"), value: "hsl(var(--color-bg))" },
  canvas: {
    name: t("storybook.backgrounds.canvas"),
    value: "hsl(var(--surface-1, var(--color-bg)))",
  },
  dark: {
    name: t("storybook.backgrounds.dark"),
    value: "hsl(var(--color-bg-dark, var(--color-bg)))",
  },
});
