"use client";

import React from "react";

type State = { hasError: boolean; info?: string };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log for diagnostics; do not leak to network here
    try { console.error("PageBuilder error boundary caught:", error, info?.componentStack); } catch {}
    // Announce to live region if present
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "An error occurred. Interaction canceled." })); } catch {}
    this.setState({ hasError: true, info: info?.componentStack ?? undefined });
  }

  private reset = () => {
    this.setState({ hasError: false, info: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-2 rounded border border-danger/40 bg-danger/5 p-3 text-sm">
          <div className="mb-2 font-medium">Something went wrong.</div>
          <div className="mb-3 text-muted-foreground">The editor paused due to an error. You can try to continue.</div>
          <button type="button" className="rounded border px-2 py-1" onClick={this.reset} aria-label="Try again">Try again</button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
