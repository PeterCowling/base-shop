import type { Locale } from "@acme/i18n/locales";
import * as React from "react";
import { cn } from "../../utils/style";
import type { LogoVariants } from "./types";
import useViewport from "../../hooks/useViewport";
import { LanguageSwitcher, SearchBar } from "../molecules";
import { Logo } from "../atoms";
import { useTranslations } from "@acme/i18n";
import { Inline } from "../atoms/primitives/Inline";
import { Stack } from "../atoms/primitives/Stack";
import { Cluster } from "../atoms/primitives/Cluster";

export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection extends NavItem {
  items?: NavItem[];
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Top level navigation sections */
  nav?: NavSection[];
  /** Search suggestions for predictive search */
  searchSuggestions?: string[];
  /** Currently selected locale */
  locale: Locale;
  /** Responsive logo variants */
  logoVariants?: LogoVariants;
  /** Shop name for text fallback */
  shopName: string;
  /** Whether to display the search bar */
  showSearch?: boolean;
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      nav = [],
      searchSuggestions = [],
      locale,
      logoVariants,
      shopName,
      showSearch = true,
      className,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations();
    const viewport = useViewport();
    const logo = logoVariants?.[viewport];
    // i18n-exempt: CSS utility class strings
    const headerBaseClass = "bg-surface-1 border-b border-border-2";
    return (
      <header
        ref={ref}
        data-token="--color-bg"
        className={cn(headerBaseClass, className)}
        {...props}
      >
        {/* i18n-exempt: CSS utility class strings */}
        <div className="mx-auto h-16 px-4">
          {/* i18n-exempt: CSS utility class strings */}
          <Cluster alignY="center" justify="between" className="h-full gap-6">
            <a href="/" data-token="--color-fg">
              <Logo
                src={logo?.src}
                width={logo?.width}
                height={logo?.height}
                alt={shopName}
                fallbackText={shopName}
                className="font-bold" /* i18n-exempt: CSS utility class string */
              />
            </a>
            {/* eslint-disable-next-line ds/no-raw-font -- DS-1234: false positive; rule matches "aria-label" as "arial" */}
            <nav aria-label={String(t("nav.mainAriaLabel"))}>
              <Inline gap={6}>
                {nav.map((section) => (
                  <div key={section.title} className="group relative">
                    <a
                      href={section.href}
                      className="inline-flex min-h-10 min-w-10 items-center font-medium"
                      data-token="--color-fg"
                    >
                      {section.title}
                    </a>
                    {section.items && section.items.length > 0 && (
                  <div className="bg-panel border-border-2 absolute top-full start-0 hidden w-48 rounded-md border p-2 shadow-elevation-3 group-hover:block">
                    <Stack gap={1}>
                      <ul>
                        {section.items.map((item) => (
                          <li key={item.title}>
                            <a
                              href={item.href}
                              className="block rounded px-3 py-2 text-sm hover:bg-surface-3 min-h-10 min-w-10" /* i18n-exempt */
                              data-token="--color-fg"
                            >
                              {item.title}
                            </a>
                          </li>
                        ))}
                          </ul>
                        </Stack>
                      </div>
                    )}
                  </div>
                ))}
              </Inline>
            </nav>

            <Cluster justify="end" className="flex-1 gap-4">
              {showSearch && (
              <div className="flex-1 sm:w-64">
                <SearchBar suggestions={searchSuggestions} label={t("search.products.label") as string} />
              </div>
            )}
            <LanguageSwitcher current={locale} />
            </Cluster>
          </Cluster>
        </div>
      </header>
    );
  }
);
Header.displayName = "Header";
