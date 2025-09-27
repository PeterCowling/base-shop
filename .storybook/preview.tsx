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
  scenario: {
    name: "Scenario",
    description: "Data scenario (affects MSW)",
    defaultValue: "featured",
    toolbar: {
      icon: "contrast",
      items: ["featured", "new", "bestsellers", "clearance", "limited"],
    },
  },
  locale: {
    name: "Locale",
    description: "Active locale",
    defaultValue: "en",
    toolbar: { icon: "globe", items: ["en", "de", "fr"] },
  },
  currency: {
    name: "Currency",
    description: "Active currency",
    defaultValue: "USD",
    toolbar: { icon: "creditcard", items: ["USD", "EUR", "GBP"] },
  },
  net: {
    name: "Network",
    description: "Mock network speed",
    defaultValue: "normal",
    toolbar: { icon: "power", items: ["fast", "normal", "slow"] },
  },
  netError: {
    name: "Net Error",
    description: "Force API 500 errors",
    defaultValue: "off",
    toolbar: { icon: "alert", items: ["off", "on"] },
  },
};

const withTokens: Decorator = (Story, context) => {
  const { tokens } = context.globals as { tokens: string };
  const cls = document.documentElement.classList;
  cls.remove("theme-base", "theme-brandx");
  cls.add(`theme-${tokens}`);
  return <Story />;
};

const withGlobals: Decorator = (Story, context) => {
  const { scenario, locale, currency, net, netError } = context.globals as { scenario: string; locale: string; currency: string; net: string; netError: string };
  try {
    (window as any).__SB_GLOBALS__ = { scenario, locale, currency, net, netError };
    document.documentElement.lang = locale;
    window.dispatchEvent(new CustomEvent('sb:globals', { detail: { scenario, locale, currency, net, netError } }));
  } catch {}
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
    withGlobals,
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
