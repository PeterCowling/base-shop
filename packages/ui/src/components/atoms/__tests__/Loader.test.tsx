import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { Loader } from "../Loader";
import React from "react";

describe("Loader", () => {
  it("applies default size classes", () => {
    const { container } = render(<Loader />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("h-[20px]");
    expect(div).toHaveClass("w-[20px]");
  });

  it("accepts custom size", () => {
    const { container } = render(<Loader size={40} />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("h-[40px]");
    expect(div).toHaveClass("w-[40px]");
  });

  it("merges class names", () => {
    const { container } = render(<Loader className="text-blue" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("animate-spin");
    expect(div).toHaveClass("text-blue");
  });

  it("forwards refs", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Loader ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
