// @tests/renderers - shared test rendering utilities
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
}

/**
 * Render a component with common providers (i18n, router context, etc.)
 * This is a lightweight wrapper around @testing-library/react's render.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { route, ...renderOptions } = options;

  if (route && typeof window !== "undefined") {
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: route, href: `http://localhost${route}` },
      writable: true,
    });
  }

  return render(ui, renderOptions);
}

interface RenderRouteOptions {
  route?: string;
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Render a route component with navigation context.
 * Used primarily by guide coverage tests.
 */
export function renderRoute(
  ui: ReactElement,
  options: RenderRouteOptions = {},
): RenderResult {
  const { route, ...rest } = options;

  if (route && typeof window !== "undefined") {
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: route, href: `http://localhost${route}` },
      writable: true,
    });
  }

  return render(ui, rest);
}
