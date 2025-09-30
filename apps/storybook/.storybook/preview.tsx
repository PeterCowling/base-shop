// .storybook/preview.ts

import { withThemeByClassName } from "@storybook/addon-themes";
import { ThemeProvider as SBThemeProvider, themes } from "@storybook/theming";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { DocsContainer, Primary, Stories } from "@storybook/blocks";
import type { Decorator, Preview } from "@storybook/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { ThemeVars } from "@storybook/theming";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import "./styles/sb-globals.css";
import { initialize, mswLoader } from "msw-storybook-addon";
import { handlers as mswHandlers } from "./msw/handlers";
import { mapDataStateToMsw } from "./msw/state-mapping";
import { VIEWPORTS } from "./viewports";
import { withRTL } from "./decorators/rtlDecorator";
import { withPerf } from "./decorators/perfDecorator";
import { createBackgroundOptions, DEFAULT_BACKGROUND } from "./backgrounds";
import type { ToolbarGlobals, StoryDataState } from "./types";
import enMessages from "@acme/i18n/en.json";
import { sb } from "storybook/test";

// Register Storybook automocks for common Next.js modules once for the project
sb.mock(import("next/navigation"));
sb.mock(import("next/image"));
sb.mock(import("next/headers"));

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
    // Use a supported Storybook icon key; 'creditcard' is not available in SB9
    toolbar: { icon: "circle", items: ["USD", "EUR", "GBP"] },
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

// Concrete SB theme object with required typography.fonts to satisfy Docs resets
const lightTheme = themes.light as ThemeVars;

const sbTheme: ThemeVars = {
  ...lightTheme,
  typography: {
    ...(lightTheme.typography ?? {}),
    fonts: {
      base: "var(--typography-body-font-family, var(--font-body, var(--font-sans)))",
      mono: "var(--typography-code-font-family, var(--font-mono, ui-monospace))",
    },
  },
};

type EmotionThemeLike = ThemeVars & Record<string, unknown>;

const emotionTheme = sbTheme as EmotionThemeLike;

// Ensure Docs pages are always wrapped with a theme that includes typography.fonts
const ThemedDocsContainer: React.FC<{ context: unknown; children: ReactNode }> = ({ context, children }) => (
  <EmotionThemeProvider theme={emotionTheme}>
    <SBThemeProvider theme={sbTheme}>
      {/* @ts-expect-error - docs container accepts theme in runtime */}
      <DocsContainer context={context} theme={sbTheme}>
        {children}
      </DocsContainer>
    </SBThemeProvider>
  </EmotionThemeProvider>
);

// Minimal, safe Docs page that avoids styled Title/Code blocks
const SafeDocsPage = () => (
  <div>
    <Primary />
    <Stories includePrimary={false} />
  </div>
);

type StoryDocsComponent<Tag extends keyof JSX.IntrinsicElements> = (
  props: ComponentPropsWithoutRef<Tag>
) => JSX.Element;

const docsComponents: {
  h1: StoryDocsComponent<"h1">;
  h2: StoryDocsComponent<"h2">;
  code: StoryDocsComponent<"code">;
  pre: StoryDocsComponent<"pre">;
} = {
  h1: (props) => <h1 {...props} />,
  h2: (props) => <h2 {...props} />,
  code: (props) => <code {...props} />,
  pre: (props) => <pre {...props} />,
};

const backgroundOptions = createBackgroundOptions(t);

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: mswHandlers },
    docs: {
      theme: sbTheme,
      container: ThemedDocsContainer,
      page: SafeDocsPage,
      // Work around theming context conflicts by rendering plain code/pre elements
      components: docsComponents,
    },
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
      default: DEFAULT_BACKGROUND,
      options: backgroundOptions,
    },
  },
  decorators: [
    (Story) => (
      <EmotionThemeProvider theme={emotionTheme}>
        <SBThemeProvider theme={sbTheme}>
          <Story />
        </SBThemeProvider>
      </EmotionThemeProvider>
    ),
    withTokens,
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
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
