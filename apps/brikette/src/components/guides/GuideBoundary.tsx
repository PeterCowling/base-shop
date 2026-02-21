"use client";

// src/components/guides/GuideBoundary.tsx
// Error boundary for guide content rendering — shows a user-friendly fallback
// instead of crashing the page.

import React from "react";

import { debugGuide } from "@/utils/debug";

type BoundaryState = { hasError: boolean };
type BoundaryProps = { children: React.ReactNode; guideKey?: string };

class GuideBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    // Uses isGuideDebugEnabled() which respects IS_DEV, URL params (?debug=guides),
    // and localStorage (debug:guides=1) for debugging in any environment
    debugGuide("[GuideBoundary]", this.props.guideKey ?? "unknown", error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-1 bg-surface-1 p-6 text-center text-muted">
          {/* eslint-disable-next-line ds/no-hardcoded-copy -- CFL-99 pre-existing: error boundary fallback text */}
          <p className="text-sm">This content could not be loaded. Please try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export { GuideBoundary };
