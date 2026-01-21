import React from "react";
import { Links, Meta, Scripts,ScrollRestoration } from "react-router";
import { useInRouterContext } from "react-router-dom";

// Some framework placeholders (Links/Meta/Scripts/ScrollRestoration) throw
// when not rendered under a HydratedRouter. Tests commonly mount with a
// MemoryRouter/RouterProvider, so we guard with an error boundary to no-op.
class FrameworkSafeBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  override componentDidCatch(): void {
    // Swallow framework-context errors; placeholders are optional in tests.
  }
  override render(): React.ReactNode {
    if (this.state.hasError) return null;
    return this.props.children ?? null;
  }
}

function RouterHeadPlaceholders(): React.JSX.Element | null {
  // In unit tests we commonly render under MemoryRouter/RouterProvider,
  // not HydratedRouter. Avoid rendering framework placeholders entirely
  // to prevent noisy console errors from React error boundaries.
  const inRouter = useInRouterContext();
  // Only skip when not inside a router. In tests, still attempt to render
  // and rely on the boundary to swallow framework-context errors.
  if (!inRouter) return null;

  return (
    <FrameworkSafeBoundary>
      <Links />
      <Meta />
    </FrameworkSafeBoundary>
  );
}

function RouterBodyPlaceholders(): React.JSX.Element | null {
  const inRouter = useInRouterContext();
  if (!inRouter) return null;

  return (
    <FrameworkSafeBoundary>
      <ScrollRestoration />
      <Scripts />
    </FrameworkSafeBoundary>
  );
}

export { RouterBodyPlaceholders, RouterHeadPlaceholders };
