import type { Locale } from "@/i18n/locales";
import * as React from "react";
import { cn } from "../../utils/cn";
import { LanguageSwitcher, SearchBar } from "../molecules";

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
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ nav = [], searchSuggestions = [], locale, className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn("bg-background border-b", className)}
      {...props}
    >
      <div className="mx-auto flex h-16 items-center justify-between gap-6 px-4">
        <nav className="flex gap-6">
          {nav.map((section) => (
            <div key={section.title} className="group relative">
              <a href={section.href} className="font-medium">
                {section.title}
              </a>
              {section.items && section.items.length > 0 && (
                <div className="bg-background absolute top-full left-0 z-10 hidden min-w-[12rem] rounded-md border p-4 shadow-lg group-hover:block">
                  <ul className="flex flex-col gap-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        <a href={item.href} className="hover:underline">
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

        <div className="flex flex-1 justify-end gap-4">
          <div className="max-w-xs flex-1">
            <SearchBar suggestions={searchSuggestions} />
          </div>
          <LanguageSwitcher current={locale} />
        </div>
      </div>
    </header>
  )
);
Header.displayName = "Header";
