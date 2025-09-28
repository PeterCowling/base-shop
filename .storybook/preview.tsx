// .storybook/preview.ts

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import "./styles/sb-globals.css";
import { initialize, mswDecorator } from "msw-storybook-addon";
import { handlers as mswHandlers } from "./msw/handlers";
import { mapDataStateToMsw } from "./msw/state-mapping";
import { VIEWPORTS } from "./viewports";
import { withRTL } from "./decorators/rtlDecorator";
import { withPerf } from "./decorators/perfDecorator";
import type { ToolbarGlobals, StoryDataState } from "./types";
import enMessages from "@acme/i18n/en.json";

// Lightweight translation function for Storybook config (non-React context)
const t = (key: string): string => (enMessages as Record<string, string>)[key] ?? key;

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
  scenario: {
    name: t("storybook.scenario.name"),
    description: t("storybook.scenario.description"),
    defaultValue: "featured",
    toolbar: {
      icon: "contrast",
      items: [
        t("storybook.scenario.items.featured"),
        t("storybook.scenario.items.new"),
        t("storybook.scenario.items.bestsellers"),
        t("storybook.scenario.items.clearance"),
        t("storybook.scenario.items.limited"),
      ],
    },
  },
  locale: {
    name: t("storybook.locale.name"),
    description: t("storybook.locale.description"),
    defaultValue: "en",
    toolbar: { icon: "globe", items: ["en", "de", "fr", "ar"] },
  },
  currency: {
    name: t("storybook.currency.name"),
    description: t("storybook.currency.description"),
    defaultValue: "USD",
    toolbar: { icon: "creditcard", items: ["USD", "EUR", "GBP"] },
  },
  net: {
    name: t("storybook.net.name"),
    description: t("storybook.net.description"),
    defaultValue: "normal",
    toolbar: {
      icon: "power",
      items: [
        t("storybook.net.items.fast"),
        t("storybook.net.items.normal"),
        t("storybook.net.items.slow"),
      ],
    },
  },
  netError: {
    name: t("storybook.netError.name"),
    description: t("storybook.netError.description"),
    defaultValue: "off",
    toolbar: { icon: "alert", items: [t("storybook.netError.items.off"), t("storybook.netError.items.on")] },
  },
};

const withTokens: Decorator = (Story, context) => {
  const { tokens } = context.globals as Pick<ToolbarGlobals, "tokens">;
  const cls = document.documentElement.classList;
  cls.remove("theme-base", "theme-brandx");
  cls.add(`theme-${tokens}`);
  return <Story />;
};

const withGlobals: Decorator = (Story, context) => {
  const { scenario, locale, currency, net, netError } = context.globals as ToolbarGlobals;
  const params = context.parameters as Record<string, unknown>;
  const dataState = (params?.dataState as StoryDataState | undefined) ?? "default";
  try {
    const msw = mapDataStateToMsw(dataState, { scenario, locale, currency, net, netError });
    window.__SB_GLOBALS__ = { scenario, locale, currency, net, netError, msw };
    document.documentElement.lang = locale;
    window.dispatchEvent(new CustomEvent("sb:globals", { detail: { scenario, locale, currency, net, netError } }));
  } catch {}
  return <Story />;
};

// Initialize Mock Service Worker once per session
initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
  parameters: {
    msw: { handlers: mswHandlers },
    docs: { autodocs: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Overview',
          'Tokens',
          'Pages',
          'Compositions',
          'Organisms',
          'Molecules',
          'Atoms',
          'CMS Blocks',
          'Utilities',
        ],
        locales: 'en',
      },
    },
    viewport: {
      viewports: VIEWPORTS,
      defaultViewport: "desktop",
    },
    backgrounds: {
      default: t("storybook.backgrounds.app"),
      values: [
        { name: t("storybook.backgrounds.app"), value: "hsl(var(--color-bg))" },
        { name: t("storybook.backgrounds.canvas"), value: "hsl(var(--surface-1, var(--color-bg)))" },
        { name: t("storybook.backgrounds.dark"), value: "hsl(var(--color-bg-dark, var(--color-bg)))" },
      ],
    },
  },
  decorators: [
    withTokens,
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
    mswDecorator,
    withRTL,
    withGlobals,
    withPerf,
    // Opt-in cart provider: set `parameters: { cart: true }` in a story to wrap it
    ((Story, ctx) => {
      const { cart } = (ctx.parameters as Record<string, unknown>) ?? {};
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
