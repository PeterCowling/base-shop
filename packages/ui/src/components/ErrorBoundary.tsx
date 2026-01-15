// packages/ui/src/components/ErrorBoundary.tsx

"use client";

import React from "react";
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
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-semibold">
              Something went wrong
            </h1>
            <p className="mb-6 text-muted-foreground">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
