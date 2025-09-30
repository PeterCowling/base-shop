import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import "../../../packages/themes/base/src/tokens.css";
import en from "../../../packages/i18n/src/en.json";
import { createBackgroundOptions, DEFAULT_BACKGROUND } from "../.storybook/backgrounds";
import { a11yGlobals, a11yParameters } from "../.storybook/a11y";
import { withHighlight } from "../.storybook/decorators/highlightDecorator";

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

const backgroundOptions = createBackgroundOptions(t);

const preview: Preview = {
  parameters: {
    ...a11yParameters,
    backgrounds: {
      options: backgroundOptions,
    },
    measure: {
      disable: false,
    },
    outline: {
      disable: false,
    },
    // CI runs on a curated, fast subset. A11y is enabled per critical story via story parameters.
  },
  decorators: [
    withThemeByClassName({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
    }),
    withTokens,
    withHighlight,
  ],
  initialGlobals: {
    backgrounds: { value: DEFAULT_BACKGROUND },
  },
  globals: {
    ...a11yGlobals,
  },
};

export default preview;
