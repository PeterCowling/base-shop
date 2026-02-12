/**
 * NavigationHeader Component
 * Main navigation header with business selector and navigation links
 * BOS-UX-04, BOS-UX-15
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";

import type { User } from "@/lib/current-user";
import type { Business } from "@/lib/types";

import { QuickCaptureModal } from "../capture/QuickCaptureModal";
import { UserSwitcher } from "../user/UserSwitcher";

import { BusinessSelector } from "./BusinessSelector";

export interface NavigationHeaderProps {
  businesses: Business[];
  currentBusiness: string;
  currentUser: User;
}

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/boards", label: "Boards" },
  { href: "/ideas", label: "Ideas" },
  { href: "/people", label: "People" },
  { href: "/plans", label: "Plans" },
  { href: "/archive", label: "Archive" },
];

type AutomationBadgeState = "Healthy" | "Attention" | "Unknown";

interface AutomationStatusResponse {
  status: "ok" | "degraded";
  automation: {
    lastSweepRunStatus: "complete" | "partial" | "failed-preflight" | "unknown";
    discoveryIndexStatus: "fresh" | "stale" | "unknown";
  };
}

function mapAutomationBadgeState(payload: AutomationStatusResponse): AutomationBadgeState {
  if (
    payload.status === "degraded" ||
    payload.automation.lastSweepRunStatus === "partial" ||
    payload.automation.lastSweepRunStatus === "failed-preflight" ||
    payload.automation.discoveryIndexStatus === "stale"
  ) {
    return "Attention";
  }

  if (payload.status === "ok" && payload.automation.discoveryIndexStatus === "fresh") {
    return "Healthy";
  }

  return "Unknown";
}

function badgeClasses(state: AutomationBadgeState): string {
  switch (state) {
    case "Healthy":
      return "border border-emerald-300 bg-emerald-50 text-emerald-900";
    case "Attention":
      return "border border-amber-300 bg-amber-50 text-amber-900";
    default:
      return "border border-slate-300 bg-slate-100 text-slate-700";
  }
}

export function NavigationHeader({
  businesses,
  currentBusiness,
  currentUser,
}: NavigationHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [automationBadgeState, setAutomationBadgeState] = useState<AutomationBadgeState>("Unknown");

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href) ?? false;
  };

  useEffect(() => {
    let active = true;

    async function loadAutomationStatus() {
      try {
        const response = await fetch("/api/automation/status");
        if (!response.ok) {
          throw new Error(`automation status request failed: ${response.status}`);
        }
        const payload = (await response.json()) as AutomationStatusResponse;
        if (active) {
          setAutomationBadgeState(mapAutomationBadgeState(payload));
        }
      } catch {
        if (active) {
          setAutomationBadgeState("Unknown");
        }
      }
    }

    void loadAutomationStatus();

    return () => {
      active = false;
    };
  }, []);

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
          <span
            aria-label="Automation status"
            className={`rounded-full px-2 py-1 text-xs font-medium ${badgeClasses(automationBadgeState)}`}
          >
            {automationBadgeState}
          </span>

          {/* Capture Button */}
          <Button
            onClick={() => setCaptureModalOpen(true)}
            variant="default"
            size="sm"
            aria-label="Capture idea"
          >
            + Capture
          </Button>

          {/* User Switcher (dev mode only) */}
          <UserSwitcher currentUser={currentUser} />

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
          <div className="px-4 pt-4">
            <span
              aria-label="Automation status"
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${badgeClasses(automationBadgeState)}`}
            >
              {automationBadgeState}
            </span>
          </div>

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
