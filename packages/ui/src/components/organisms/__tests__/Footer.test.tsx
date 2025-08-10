import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

describe("Footer", () => {
  it("renders children and applies className", () => {
    render(<Footer className="custom">Content</Footer>);
    const footer = screen.getByText("Content").closest("footer");
    expect(footer).toHaveClass("custom");
  });
});
