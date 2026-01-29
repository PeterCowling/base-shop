/**
 * NavigationHeader Component
 * Main navigation header with business selector and navigation links
 * BOS-UX-04
 */

/* eslint-disable ds/enforce-layout-primitives, ds/no-arbitrary-tailwind -- BOS-UX-04: Phase 0 scaffold UI */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Business } from "@/lib/types";

import { BusinessSelector } from "./BusinessSelector";

export interface NavigationHeaderProps {
  businesses: Business[];
  currentBusiness: string;
}

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/boards", label: "Boards" },
  { href: "/people", label: "People" },
  { href: "/plans", label: "Plans" },
];

export function NavigationHeader({
  businesses,
  currentBusiness,
}: NavigationHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo / Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            Business OS
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Business Selector */}
        <div className="hidden md:block">
          <BusinessSelector
            businesses={businesses}
            currentBusiness={currentBusiness}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-2" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Business Selector */}
          <div className="px-4 pb-4">
            <BusinessSelector
              businesses={businesses}
              currentBusiness={currentBusiness}
            />
          </div>
        </div>
      )}
    </header>
  );
}
