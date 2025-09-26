// .storybook/preview.ts

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import "./styles/sb-globals.css";
import { initialize, mswDecorator } from "msw-storybook-addon";
import { handlers as mswHandlers } from "./msw/handlers";

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

// Initialize Mock Service Worker once per session
initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
  parameters: {
    msw: { handlers: mswHandlers },
    docs: { autodocs: true },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
    mswDecorator,
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
