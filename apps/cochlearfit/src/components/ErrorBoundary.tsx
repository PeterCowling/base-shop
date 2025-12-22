"use client";

import React, { useCallback, useMemo } from "react";
import { useTranslations } from "@acme/i18n";
import Button from "@/components/Button";

type ErrorBoundaryState = {
  hasError: boolean;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

class ErrorBoundaryImpl extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    try {
      // i18n-exempt -- CF-1003 dev-only log prefix [ttl=2026-12-31]
      console.error("CochlearFit UI error boundary:", error);
    } catch {
      // ignore logging errors
    }
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return null;
  }
}

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const t = useTranslations();
  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const defaultFallback = useMemo(
    () => (
      <div className="surface rounded-3xl border border-border-1 p-5 text-sm">
        <div className="mb-2 font-semibold">{t("error.title") as string}</div>
        <div className="mb-4 text-muted-foreground">{t("error.body") as string}</div>
        <Button type="button" variant="outline" onClick={handleReload}>
          {t("error.retry") as string}
        </Button>
      </div>
    ),
    [handleReload, t]
  );

  return <ErrorBoundaryImpl fallback={fallback ?? defaultFallback}>{children}</ErrorBoundaryImpl>;
}
