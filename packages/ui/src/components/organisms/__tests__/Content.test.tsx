/* i18n-exempt file -- tests use literal copy for assertions */
import { render } from "@testing-library/react";
import React from "react";
import { Content } from "../Content";

describe("Content", () => {
  it("merges className with defaults", () => {
    const { container } = render(<Content className="custom" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("flex-1");
    expect(div).toHaveClass("p-4");
    expect(div).toHaveClass("custom");
  });

  it("forwards refs", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Content ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
