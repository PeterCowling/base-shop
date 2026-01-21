import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

import { Loader } from "../Loader";

describe("Loader", () => {
  it("applies default size classes", () => {
    const { container } = render(<Loader />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ width: "20px", height: "20px" });
    expect(div).toHaveAttribute("role", "status");
  });

  it("accepts custom size", () => {
    const { container } = render(<Loader size={40} />);
    const div = container.firstElementChild as HTMLDivElement;
    expect(div).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("merges class names", () => {
    const { container } = render(<Loader className="text-foreground" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("animate-spin");
    expect(div).toHaveClass("text-foreground");
  });

  it("forwards refs", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Loader ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
