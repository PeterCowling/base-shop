import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const blockRegistryMock = {
  Custom: {
    component: ({ label, onClick }: { label: string; onClick: () => void }) => (
      <button onClick={onClick}>{label}</button>
    ),
  },
};

jest.mock("../../blocks", () => ({
  blockRegistry: blockRegistryMock,
}));

import Block from "../Block";

describe("Block", () => {
  it("renders sanitized text", () => {
    const component = {
      id: "1",
      type: "Text" as const,
      text: "<script>alert('x')</script><b>Hi</b>",
    };
    const { container } = render(<Block component={component} locale="en" />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });

  it("resolves components from registry and passes callbacks", () => {
    const onClick = jest.fn();
    const component = {
      id: "2",
      type: "Custom" as const,
      label: "Press",
      onClick,
    };
    render(<Block component={component} locale="en" />);
    fireEvent.click(screen.getByText("Press"));
    expect(onClick).toHaveBeenCalled();
  });
});
