"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary for the inbox detail/draft panel.
 * Catches render errors so the thread list stays functional and staff
 * can switch threads to recover.
 */
export default class InboxErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[InboxErrorBoundary] Render error caught:", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-warning-muted bg-surface-1 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-soft text-warning-main">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Something went wrong
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The detail panel hit an error. Your thread list is still available
              — try selecting another thread or click below to retry.
            </p>
          </div>
          <Button
            type="button"
            onClick={this.handleRetry}
            color="info"
            tone="outline"
            className="rounded-xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
