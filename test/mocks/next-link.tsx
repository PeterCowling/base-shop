import React from "react";

// Lightweight Next.js Link mock for Jest.
// Strips Next-specific props (e.g. `scroll`, `prefetch`) to avoid React
// unknown prop warnings while preserving accessible anchors.
export default function Link({
  href,
  children,
  // Next.js-specific props we don't forward to the DOM
  as: _as,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  prefetch: _prefetch,
  locale: _locale,
  passHref: _passHref,
  legacyBehavior: _legacyBehavior,
  ...rest
}: any) {
  return React.createElement("a", { href, ...rest }, children);
}

export {}; // ensure this is treated as a module

