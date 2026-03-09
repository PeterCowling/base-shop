"use client";

import { Button } from "@acme/design-system/atoms";

export interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  routeName?: string;
}

export function RouteErrorFallback({ error, reset, routeName }: RouteErrorFallbackProps) {
  const message = routeName
    ? `An error occurred in ${routeName}. Please try again or contact your administrator if the problem persists.`
    : "An unexpected error occurred. Please try again or contact your administrator if the problem persists.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="bg-surface-2 rounded-lg p-6 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-4 text-sm">{message}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <Button type="button" onClick={reset} color="primary" tone="solid" size="lg">
          Try again
        </Button>
      </div>
    </div>
  );
}
