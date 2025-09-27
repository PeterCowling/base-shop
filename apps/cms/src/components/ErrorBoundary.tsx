// apps/cms/src/components/ErrorBoundary.tsx

"use client";

import React from "react";
import { useTranslations } from "@acme/i18n";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

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
    // Log the error to the console (replace with Sentry.captureException if needed)
    // i18n-exempt: logging message is not user-facing copy
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const DefaultFallback = () => {
        const t = useTranslations();
        return (
          <div className="rounded-md border border-border-2 bg-danger-soft p-3">
            <p className="text-danger-foreground">{t("Something went wrong.")}</p>
          </div>
        );
      };
      return (this.props.fallback as React.ReactNode) ?? <DefaultFallback />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
