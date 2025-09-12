import { render } from "@testing-library/react";
import React from "react";
import { Content } from "./Content";

describe("Content", () => {
  it("renders with optional props", () => {
    const { getByTestId } = render(
      <Content className="extra" data-cy="content" id="foo" />
    );
    const div = getByTestId("content");
    expect(div).toHaveClass("flex-1", "p-4", "extra");
    expect(div.id).toBe("foo");
  });

  it("renders without optional props", () => {
    const { container } = render(<Content />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("flex-1", "p-4");
  });
});
