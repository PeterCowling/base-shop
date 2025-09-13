import React from "react";
jest.mock("next/image", () => ({
    __esModule: true,
    // Remove the `fill` prop which Next.js handles internally so it isn't
    // forwarded to the underlying `<img>` and triggering React warnings.
    default: ({ fill: _fill, ...props }) => React.createElement("img", props),
}));
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children, ...rest }) => React.createElement("a", { href, ...rest }, children),
}));
