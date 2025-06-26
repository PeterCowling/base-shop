// .storybook/preview.ts

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";
import "../apps/cms/src/app/globals.css";

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
