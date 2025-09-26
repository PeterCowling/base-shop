// .storybook/preview.ts

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
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
    // Opt-in cart provider: set `parameters: { cart: true }` in a story to wrap it
    ((Story, ctx) => {
      const { cart } = (ctx.parameters as any) ?? {};
      if (!cart) return <Story />;
      return (
        <CartProvider>
          <Story />
        </CartProvider>
      );
    }) as Decorator,
  ],
};

export default preview;
