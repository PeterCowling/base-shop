// --------------------------------------------------------------------------
// React Error Boundary with simple fallback UI
// --------------------------------------------------------------------------
import React, { Component, type ReactNode } from "react";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error({ error, info });
    }
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="mb-4 text-2xl font-semibold">{i18n.t("errorBoundary.title")}</h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-10 min-w-10 items-center justify-center px-4 underline"
          >
            {i18n.t("errorBoundary.reload")}
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;