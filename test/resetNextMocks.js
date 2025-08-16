import React from "react";
jest.mock("next/image", () => ({
    __esModule: true,
    default: (props) => React.createElement("img", props),
}));
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children, ...rest }) => React.createElement("a", { href, ...rest }, children),
}));
