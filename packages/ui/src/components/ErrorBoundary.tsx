// packages/ui/src/components/ErrorBoundary.tsx
/* eslint-disable ds/no-hardcoded-copy -- UI-3002 [ttl=2026-12-31] default fallback copy; apps may override via `fallback` prop */

"use client";

import React from "react";
import { Grid, Stack } from "./atoms/primitives";
import { captureError } from "@acme/telemetry";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  app: string; // Required: app identifier
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Shared ErrorBoundary component with telemetry integration.
 * Captures errors to @acme/telemetry for centralized error tracking.
 *
 * @example
 * ```tsx
 * <ErrorBoundary app="brikette">
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error for telemetry tracking
    void captureError(error, {
      app: this.props.app,
      componentStack: errorInfo.componentStack,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      // i18n-exempt: logging message is not user-facing copy
      console.error("ErrorBoundary caught an error", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Grid
          cols={1}
          gap={6}
          className="min-h-dvh place-items-center p-8 text-center"
        >
          <Stack gap={4} className="w-full sm:w-96">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-foreground/70">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              Reload page
            </button>
          </Stack>
        </Grid>
      );
    }

    return this.props.children;
  }
}
