import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Tag } from "../Tag";

describe("Tag", () => {
  it("renders with default variant", () => {
    render(<Tag>Default</Tag>);
    const tag = screen.getByText("Default");
    expect(tag).toHaveAttribute("data-token", "--color-muted");
    expect(tag).toHaveAttribute("data-token-fg", "--color-fg");
    expect(tag).toHaveClass("bg-muted", "text-fg");
  });

  it("applies success variant classes", () => {
    render(<Tag variant="success">Success</Tag>);
    const tag = screen.getByText("Success");
    expect(tag).toHaveClass("bg-success", "text-success-fg");
    expect(tag).toHaveAttribute("data-token", "--color-success");
    expect(tag).toHaveAttribute("data-token-fg", "--color-success-fg");
  });
});
