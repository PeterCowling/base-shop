import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import "../packages/themes/base/src/tokens.css";
import en from "../packages/i18n/src/en.json";

const t = (key: string) => (en as Record<string, string>)[key] ?? key;

export const globalTypes = {
  tokens: {
    name: t("storybook.tokens.name"),
    description: t("storybook.tokens.description"),
    defaultValue: "base",
    toolbar: {
      icon: "paintbrush",
      items: [
        { value: "base", title: t("storybook.tokens.theme.base") },
        { value: "brandx", title: t("storybook.tokens.theme.brandx") },
      ],
    },
  },
};

const withTokens: Decorator = (Story, context) => {
  const { tokens } = context.globals as { tokens: string };
  const cls = document.documentElement.classList;
  cls.remove("theme-base", "theme-brandx");
  cls.add(`theme-${tokens}`);
  return <Story />;
};

const preview: Preview = {
  parameters: {
    // CI runs on a curated, fast subset. A11y is enabled per critical story via story parameters.
  },
  decorators: [
    withThemeByClassName({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
    }),
    withTokens,
  ],
};

export default preview;
