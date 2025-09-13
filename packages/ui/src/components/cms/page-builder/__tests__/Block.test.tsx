import { render, screen } from "@testing-library/react";
import React from "react";
import Button from "../../blocks/Button";

const blockRegistryMock = {
  Foo: {
    component: ({ style }: { style?: React.CSSProperties }) => (
      <div data-cy="foo" style={style}>
        Foo
      </div>
    ),
  },
  Bar: {
    component: () => <div data-cy="bar">Bar</div>,
  },
  Button: {
    component: Button,
  },
};

jest.mock("../../blocks", () => ({
  blockRegistry: blockRegistryMock,
}));

import Block from "../Block";

describe("Block", () => {
  it.each([
    ["Foo", "foo"],
    ["Bar", "bar"],
  ])("renders block type %s", (type, testId) => {
    render(<Block component={{ id: "1", type: type as any }} locale="en" />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it("passes through style props", () => {
    render(
      <Block
        component={{ id: "2", type: "Foo" as any, style: { color: "red" } }}
        locale="en"
      />,
    );
    expect(screen.getByTestId("foo")).toHaveStyle({ color: "red" });
  });

  it("sanitizes text components", () => {
    const { container } = render(
      <Block
        component={{ id: "3", type: "Text" as any, text: '<img src=x onerror="alert(1)">' }}
        locale="en"
      />,
    );
    expect(container.querySelector("img")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("onerror");
  });

  it("returns null for unknown component type", () => {
    const { container } = render(
      <Block component={{ id: "4", type: "Baz" as any }} locale="en" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("wraps non-button components in anchor when navigating", () => {
    render(
      <Block
        component={{
          id: "5",
          type: "Foo" as any,
          clickAction: "navigate",
          href: "/foo",
        }}
        locale="en"
      />,
    );
    const foo = screen.getByTestId("foo");
    expect(foo.closest("a")).toHaveAttribute("href", "/foo");
  });

  it("passes href to button without wrapping in anchor when navigating", () => {
    render(
      <Block
        component={{
          id: "6",
          type: "Button" as any,
          clickAction: "navigate",
          href: "/bar",
        }}
        locale="en"
      />,
    );
    const link = screen.getByRole("link", { name: "Button" });
    expect(link).toHaveAttribute("href", "/bar");
    expect(link.parentElement?.tagName.toLowerCase()).not.toBe("a");
  });

  it.each([
    ["fade", "pb-animate-fade"],
    ["slide", "pb-animate-slide"],
  ])("applies %s animation class", (animation, className) => {
    render(
      <Block
        component={{ id: "7", type: "Foo" as any, animation: animation as any }}
        locale="en"
      />,
    );
    expect(screen.getByTestId("foo").parentElement).toHaveClass(className);
  });

  it("does not wrap block or apply animation class when animation is undefined", () => {
    const { container } = render(
      <Block component={{ id: "7", type: "Foo" as any }} locale="en" />,
    );
    const element = screen.getByTestId("foo");
    expect(container.firstChild).toBe(element);
    expect(container.querySelector('[class*="pb-animate-"]')).toBeNull();
  });
});

