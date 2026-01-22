// src/components/common/InlineBoundary.tsx
// Error boundary component (moved from src/root/boundaries.tsx)

import React from "react";

type BoundaryState = { hasError: boolean };
type BoundaryProps = { children: React.ReactNode };

class InlineBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch() {}

  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export { InlineBoundary };
