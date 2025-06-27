const { describe, it, expect } = require("@jest/globals");
const React = require("react");
const { render, screen } = require("@testing-library/react");
const { Icon } = require("../components/atoms/Icon.tsx");
const { HeartIcon } = require("@radix-ui/react-icons");

describe("Icon component", () => {
  it("renders the matching Radix icon", () => {
    render(
      React.createElement(
        "div",
        null,
        React.createElement(Icon, { name: "heart", "data-testid": "icon" }),
        React.createElement(HeartIcon, { "data-testid": "expected" })
      )
    );
    const iconPath = screen
      .getByTestId("icon")
      .querySelector("path")
      .getAttribute("d");
    const expectedPath = screen
      .getByTestId("expected")
      .querySelector("path")
      .getAttribute("d");
    expect(iconPath).toBe(expectedPath);
  });
});
