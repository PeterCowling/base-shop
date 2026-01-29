/**
 * NavigationHeader Component
 * Main navigation header with business selector and navigation links
 * BOS-UX-04, BOS-UX-15
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { Button } from "@acme/design-system/atoms";

import type { Business } from "@/lib/types";

import { QuickCaptureModal } from "../capture/QuickCaptureModal";
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
  const [captureModalOpen, setCaptureModalOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <header className="sticky top-0 w-full border-b border-border bg-background">
      <Inline
        alignY="center"
        wrap={false}
        className="h-16 w-full justify-between px-4 md:px-6"
      >
        {/* Logo / Brand */}
        <Inline alignY="center" gap={4} wrap={false}>
          <Link href="/" className="text-lg font-semibold text-foreground">
            Business OS
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Inline asChild alignY="center" gap={1} wrap={false}>
              <nav aria-label="Main navigation">
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
            </Inline>
          </div>
        </Inline>

        {/* Desktop Actions */}
        <Inline alignY="center" gap={2} wrap={false} className="hidden md:inline-flex">
          {/* Capture Button */}
          <Button
            onClick={() => setCaptureModalOpen(true)}
            variant="default"
            size="sm"
            aria-label="Capture idea"
          >
            + Capture
          </Button>

          {/* Business Selector */}
          <BusinessSelector
            businesses={businesses}
            currentBusiness={currentBusiness}
          />
        </Inline>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground md:hidden"
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
      </Inline>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <Stack asChild gap={2} className="p-4">
            <nav aria-label="Mobile navigation">
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
          </Stack>

          {/* Mobile Business Selector */}
          <div className="px-4 pb-4">
            <BusinessSelector
              businesses={businesses}
              currentBusiness={currentBusiness}
            />
          </div>
        </div>
      )}

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        defaultBusiness={currentBusiness}
      />
    </header>
  );
}
