import React from "react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, ...props }: any) => React.createElement("img", props),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));
