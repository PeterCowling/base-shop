"use client";

import React from "react";

import ErrorBoundary from "@/components/ErrorBoundary";

type ComponentType<P> = React.ComponentType<P>;

type WithErrorBoundaryOptions = {
  fallback?: React.ReactNode;
};

export function withErrorBoundary<P extends object>(
  Wrapped: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const ComponentWithBoundary = (props: P) => (
    <ErrorBoundary fallback={options.fallback}>
      {React.createElement(Wrapped, props)}
    </ErrorBoundary>
  );

  ComponentWithBoundary.displayName = `withErrorBoundary(${Wrapped.displayName ?? Wrapped.name ?? "Component"})`;

  return React.memo(ComponentWithBoundary);
}
