import type { Locale } from "@acme/i18n/locales";
import * as React from "react";
import { cn } from "../../utils/style";
import type { LogoVariants } from "./types";
import useViewport from "../../hooks/useViewport";
import { LanguageSwitcher, SearchBar } from "../molecules";
import { Logo } from "../atoms";

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
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    { nav = [], searchSuggestions = [], locale, logoVariants, shopName, className, ...props },
    ref,
  ) => {
    const viewport = useViewport();
    const logo = logoVariants?.[viewport];
    return (
      <header
        ref={ref}
        data-token="--color-bg"
        className={cn("bg-background border-b", className)}
        {...props}
      >
        <div className="mx-auto flex h-16 items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-6">
            <a href="/" data-token="--color-fg">
              <Logo
                src={logo?.src}
                width={logo?.width}
                height={logo?.height}
                alt={shopName}
                fallbackText={shopName}
                className="font-bold"
              />
            </a>
            <nav className="flex gap-6" aria-label="Main navigation">
            {nav.map((section) => (
              <div key={section.title} className="group relative">
                <a
                  href={section.href}
                  className="font-medium"
                  data-token="--color-fg"
                >
                  {section.title}
                </a>
                {section.items && section.items.length > 0 && (
                  <div className="bg-background absolute top-full left-0 z-10 hidden min-w-[12rem] rounded-md border p-4 shadow-lg group-hover:block">
                    <ul className="flex flex-col gap-2">
                      {section.items.map((item) => (
                        <li key={item.title}>
                          <a
                            href={item.href}
                            className="hover:underline"
                            data-token="--color-fg"
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            </nav>
          </div>

          <div className="flex flex-1 justify-end gap-4">
            <div className="max-w-xs flex-1">
              <SearchBar suggestions={searchSuggestions} label="Search products" />
            </div>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
      </header>
    );
  }
);
Header.displayName = "Header";
