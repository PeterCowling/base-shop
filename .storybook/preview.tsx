// .storybook/preview.ts

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import "../apps/cms/src/app/globals.css";

export const globalTypes = {
  tokens: {
    name: "Tokens",
    description: "Design token theme",
    defaultValue: "base",
    toolbar: {
      icon: "paintbrush",
      items: [
        { value: "base", title: "Base" },
        { value: "brandx", title: "BrandX" },
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
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
