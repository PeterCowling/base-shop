import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  // The real `next/image` component consumes the `fill` prop internally
  // and does not forward it to the underlying `<img>` element. Our test
  // mock mimics that behaviour by stripping the prop so React doesn't log
  // a warning about an unknown DOM attribute.
  default: ({ fill: _fill, ...props }: any) =>
    React.createElement("img", props),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));
