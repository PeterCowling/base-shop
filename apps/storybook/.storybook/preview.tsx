// .storybook/preview.ts

import { withThemeByClassName } from "@storybook/addon-themes";
import { ThemeProvider as SBThemeProvider, themes } from "@storybook/theming";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { DocsContainer, Primary, Stories } from "@storybook/blocks";
import type { Decorator, Preview } from "@storybook/react";
import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { ThemeVars } from "@storybook/theming";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";
import {
  CurrencyProvider,
  type Currency,
} from "@acme/platform-core/contexts/CurrencyContext";
import {
  ThemeProvider as PlatformThemeProvider,
  type Theme as PlatformTheme,
} from "@acme/platform-core/contexts/ThemeContext";
import "./styles/sb-globals.css";
import { initialize, mswLoader } from "msw-storybook-addon";
import { handlers as mswHandlers } from "./msw/handlers";
import { mapDataStateToMsw } from "./msw/state-mapping";
import { VIEWPORTS } from "./viewports";
import { withRTL } from "./decorators/rtlDecorator";
import { withPerf } from "./decorators/perfDecorator";
import { a11yGlobals, a11yParameters } from "./a11y";
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

type ProviderToggle<TConfig extends Record<string, unknown> = Record<string, unknown>> =
  | boolean
  | ({ enabled?: boolean } & TConfig);

type ProviderParameters = {
  cart?: ProviderToggle;
  currency?: ProviderToggle<{ initial?: Currency }>;
  theme?: ProviderToggle<{ initial?: PlatformTheme }>;
};

const shouldEnable = <TConfig extends Record<string, unknown>>(
  toggle: ProviderToggle<TConfig> | undefined,
): toggle is { enabled?: boolean } & TConfig =>
  toggle === true || (typeof toggle === "object" && toggle.enabled !== false);

const CurrencyProviderDecorator: React.FC<{
  initial?: Currency;
  children: ReactNode;
}> = ({ initial, children }) => {
  const originalValueRef = useRef<string | null | undefined>(undefined);
  const lastInitialRef = useRef<Currency | undefined>(undefined);

  if (typeof window !== "undefined") {
    try {
      if (lastInitialRef.current !== initial) {
        if (lastInitialRef.current === undefined) {
          originalValueRef.current = window.localStorage.getItem("PREFERRED_CURRENCY");
        }
        if (initial) {
          window.localStorage.setItem("PREFERRED_CURRENCY", initial);
        } else {
          window.localStorage.removeItem("PREFERRED_CURRENCY");
        }
        lastInitialRef.current = initial;
      }
    } catch {}
  }

  useEffect(
    () => () => {
      if (typeof window === "undefined") return;
      try {
        if (originalValueRef.current == null) {
          window.localStorage.removeItem("PREFERRED_CURRENCY");
        } else {
          window.localStorage.setItem(
            "PREFERRED_CURRENCY",
            originalValueRef.current,
          );
        }
      } catch {}
    },
    [],
  );

  return (
    <CurrencyProvider key={initial ?? "currency-default"}>{children}</CurrencyProvider>
  );
};

const ThemeProviderDecorator: React.FC<{
  initial?: PlatformTheme;
  children: ReactNode;
}> = ({ initial = "base", children }) => {
  const originalValueRef = useRef<string | null | undefined>(undefined);
  const lastInitialRef = useRef<PlatformTheme | undefined>(undefined);

  if (typeof window !== "undefined") {
    try {
      if (lastInitialRef.current !== initial) {
        if (lastInitialRef.current === undefined) {
          originalValueRef.current = window.localStorage.getItem("theme");
        }
        window.localStorage.setItem("theme", initial);
        lastInitialRef.current = initial;
      }
    } catch {}
  }

  useEffect(
    () => () => {
      if (typeof window === "undefined") return;
      try {
        if (originalValueRef.current == null) {
          window.localStorage.removeItem("theme");
        } else {
          window.localStorage.setItem("theme", originalValueRef.current);
        }
      } catch {}
    },
    [],
  );

  return (
    <PlatformThemeProvider key={initial}>{children}</PlatformThemeProvider>
  );
};

const withProviders: Decorator = (Story, context) => {
  const providers = (context.parameters?.providers ?? {}) as ProviderParameters;
  const globals = context.globals as ToolbarGlobals;

  let content = <Story />;

  if (shouldEnable(providers.theme)) {
    const themeInitial =
      typeof providers.theme === "object" && providers.theme.initial
        ? providers.theme.initial
        : "base";
    content = (
      <ThemeProviderDecorator initial={themeInitial}>{content}</ThemeProviderDecorator>
    );
  }

  if (shouldEnable(providers.currency)) {
    const currencyInitial =
      (typeof providers.currency === "object" && providers.currency.initial)
        ? providers.currency.initial
        : (globals.currency as Currency | undefined);
    content = (
      <CurrencyProviderDecorator initial={currencyInitial}>
        {content}
      </CurrencyProviderDecorator>
    );
  }

  if (shouldEnable(providers.cart)) {
    content = <CartProvider>{content}</CartProvider>;
  }

  return content;
};

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    ...a11yParameters,
    msw: { handlers: mswHandlers },
    docs: {
      theme: sbTheme,
      container: ThemedDocsContainer,
      page: SafeDocsPage,
      // Work around theming context conflicts by rendering plain code/pre elements
      components: docsComponents,
    },
    measure: {
      disable: false,
    },
    outline: {
      disable: false,
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
  globals: {
    ...a11yGlobals,
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
    withProviders,
  ],
};

export default preview;
