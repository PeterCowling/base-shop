/**
 * EmptyLaneState Component
 * Contextual empty state messaging for board lanes
 * BOS-UX-12
 */

/* eslint-disable ds/enforce-layout-primitives, ds/no-arbitrary-tailwind -- BOS-UX-12: Phase 0 scaffold UI */
"use client";

import Link from "next/link";

import type { Lane } from "@/lib/types";

export interface EmptyLaneStateProps {
  lane: Lane;
  hasFilters: boolean;
}

interface LaneConfig {
  message: string;
  icon: JSX.Element;
  cta?: {
    label: string;
    href: string;
  };
}

const LANE_CONFIGS: Record<Lane, LaneConfig> = {
  Inbox: {
    message: "No cards in Inbox. Create a new card or idea to get started.",
    icon: (
      <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    cta: {
      label: "Create Card",
      href: "/cards/new",
    },
  },
  "Fact-finding": {
    message: "No cards in Fact-finding. Move cards from Inbox to start research.",
    icon: (
      <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  Planned: {
    message: "No cards planned yet.",
    icon: (
      <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  "In progress": {
    message: "No active work. Move planned cards here to start.",
    icon: (
      <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  Blocked: {
    message: "No blocked cards.",
    icon: (
      <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  Done: {
    message: "No completed cards yet.",
    icon: (
      <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Reflected: {
    message: "No reflected cards. Complete reflection for done cards.",
    icon: (
      <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
};

export function EmptyLaneState({ lane, hasFilters }: EmptyLaneStateProps) {
  const config = LANE_CONFIGS[lane];

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <svg className="h-12 w-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <p className="text-sm text-muted-foreground max-w-xs">
          No cards match your filters. Clear filters to see all cards.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">{config.icon}</div>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        {config.message}
      </p>
      {config.cta && (
        <Link
          href={config.cta.href}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {config.cta.label}
        </Link>
      )}
    </div>
  );
}
