import React from "react";
jest.mock("next/image", () => ({
    __esModule: true,
    // Strip Next.js specific props that aren't valid on a normal `<img>` to
    // avoid React warnings during tests.
    default: ({ unoptimized, priority, fill, ...rest }) => React.createElement("img", rest),
}));
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children, ...rest }) => React.createElement("a", { href, ...rest }, children),
}));
