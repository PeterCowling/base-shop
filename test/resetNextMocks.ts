import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  // The real `next/image` component accepts a number of props that aren't
  // valid on a standard `<img>` element. Passing them through in tests causes
  // React to log warnings like "Received `true` for a non-boolean attribute
  // `unoptimized`". Strip those props before rendering a plain `<img>` to keep
  // the test output clean.
  default: ({ unoptimized, priority, fill, ...rest }: any) =>
    React.createElement("img", rest),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));
