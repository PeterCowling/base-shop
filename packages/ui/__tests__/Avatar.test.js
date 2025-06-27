const { describe, it, expect } = require("@jest/globals");
const React = require("react");
const { render, screen } = require("@testing-library/react");
const { Avatar } = require("../components/atoms/Avatar.tsx");

describe("Avatar", () => {
  it("renders fallback initial when src missing", () => {
    render(React.createElement(Avatar, { alt: "Alice" }));
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
