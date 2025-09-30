import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import type { GlobalTypes } from "@storybook/types";
import "../../../packages/themes/base/src/tokens.css";
import en from "../../../packages/i18n/src/en.json";
import { createBackgroundOptions, DEFAULT_BACKGROUND } from "../.storybook/backgrounds";
import { a11yGlobals, a11yParameters } from "../.storybook/a11y";

const t = (key: string) => (en as Record<string, string>)[key] ?? key;

const toolbarGlobalTypes = {
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
} satisfies GlobalTypes;

const withTokens: Decorator = (Story, context) => {
  const { tokens } = context.globals as { tokens: string };
  const cls = document.documentElement.classList;
  cls.remove("theme-base", "theme-brandx");
  cls.add(`theme-${tokens}`);
  return <Story />;
};

const backgroundOptions = createBackgroundOptions(t);

const preview: Preview = {
  globalTypes: toolbarGlobalTypes,
  initialGlobals: {
    tokens: "base",
  },
  parameters: {
    ...a11yParameters,
    backgrounds: {
      default: DEFAULT_BACKGROUND,
      options: backgroundOptions,
    },
    // CI runs on a curated, fast subset. A11y is enabled per critical story via story parameters.
  },
  decorators: [
    withThemeByClassName({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
    }),
    withTokens,
  ],
  globals: {
    ...a11yGlobals,
  },
};

export default preview;
