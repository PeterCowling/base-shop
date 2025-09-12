import { render, screen } from "@testing-library/react";
import React from "react";

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

  it("handles unsupported type gracefully", () => {
    const { container } = render(
      <Block component={{ id: "2", type: "Unknown" as any }} locale="en" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("passes through style props", () => {
    render(
      <Block
        component={{ id: "3", type: "Foo" as any, style: { color: "red" } }}
        locale="en"
      />,
    );
    expect(screen.getByTestId("foo")).toHaveStyle({ color: "red" });
  });
});

