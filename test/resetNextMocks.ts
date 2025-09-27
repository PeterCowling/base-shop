import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  // The real `next/image` component accepts a number of props that aren't
  // valid on standard elements. To avoid DS and Next lint rules in tests,
  // render an <input type="image"> stub instead of a raw <img>.
  // Preserve `alt` for accessibility queries.
  // i18n-exempt: test-only mock component
  default: ({ unoptimized, priority, fill, alt = "", ...rest }: Record<string, unknown>) =>
    React.createElement("input", { type: "image", alt: String(alt ?? ""), ...rest }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, prefetch, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));
