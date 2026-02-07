import * as React from "react";

import { renderToStaticMarkup } from "../templates";

describe("renderToStaticMarkup", () => {
  it("renders primitive strings and numbers", () => {
    expect(renderToStaticMarkup("hello")).toBe("hello");
    expect(renderToStaticMarkup(123)).toBe("123");
  });

  it("renders arrays of nodes", () => {
    const nodes = [
      "Hello ",
      React.createElement("span", null, "world"),
      "!",
    ];
    expect(renderToStaticMarkup(nodes)).toBe("Hello <span>world</span>!");
  });

  it("renders React elements with nested children", () => {
    const node = React.createElement(
      "div",
      { id: "parent" },
      React.createElement("span", null, "child"),
      React.createElement("strong", null, "bold"),
    );
    expect(renderToStaticMarkup(node)).toBe(
      '<div id="parent"><span>child</span><strong>bold</strong></div>',
    );
  });

  it("returns empty string for null, undefined, or booleans", () => {
    expect(renderToStaticMarkup(null)).toBe("");
    expect(renderToStaticMarkup(undefined)).toBe("");
    expect(renderToStaticMarkup(true)).toBe("");
    expect(renderToStaticMarkup(false)).toBe("");
  });
});
