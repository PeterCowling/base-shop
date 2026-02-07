import React from "react";
import { render, screen } from "@testing-library/react";

import { Radio } from "../src/components/atoms/Radio";

describe("Radio", () => {
  it("renders input with label prop", () => {
    render(<Radio label="Choice" name="g" value="a" />);
    const input = screen.getByRole("radio");
    expect(input).toBeInTheDocument();
    expect(screen.getByText("Choice")).toBeInTheDocument();
  });

  it("renders children when label not provided", () => {
    render(<Radio name="g" value="b">ChildLabel</Radio>);
    expect(screen.getByText("ChildLabel")).toBeInTheDocument();
  });
});

