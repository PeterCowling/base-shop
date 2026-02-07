"use client";

import React from "react";

import { useTranslations } from "@acme/i18n";

type State = { hasError: boolean; info?: string };

type ImplProps = { children?: React.ReactNode; t: (k: string) => React.ReactNode } & Record<string, unknown>;

class ErrorBoundaryImpl extends React.Component<ImplProps, State> {
  constructor(props: ImplProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log for diagnostics; do not leak to network here
    try {
      console.error("PageBuilder error boundary caught:", error, info?.componentStack); // i18n-exempt -- ABC-123 debug log only; not user-facing [ttl=2026-12-31]
    } catch {}
    // Announce to live region if present
    try {
      window.dispatchEvent(
        new CustomEvent("pb-live-message", {
          detail: String(this.props.t("pb.error.interactionCanceled")),
        })
      );
    } catch {}
    this.setState({ hasError: true, info: info?.componentStack ?? undefined });
  }

  private reset = () => {
    this.setState({ hasError: false, info: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-2 rounded border border-danger/40 bg-danger/5 p-3 text-sm">
          <div className="mb-2 font-medium">{this.props.t("pb.error.somethingWrong")}</div>
          <div className="mb-3 text-muted-foreground">{this.props.t("pb.error.editorPaused")}</div>
          <button
            type="button"
            className="rounded border px-2 py-1 min-h-10 min-w-10"
            onClick={this.reset}
            aria-label={String(this.props.t("pb.error.tryAgain"))}
          >
            {this.props.t("pb.error.tryAgain")}
          </button>
        </div>
      );
    }
    return this.props.children as React.ReactNode;
  }
}

type Props = { children?: React.ReactNode } & Record<string, unknown>;

export default function ErrorBoundary(props: Props) {
  const t = useTranslations();
  return <ErrorBoundaryImpl {...props} t={t as (k: string) => React.ReactNode} />;
}
