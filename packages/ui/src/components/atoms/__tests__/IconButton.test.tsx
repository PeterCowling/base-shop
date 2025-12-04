import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { IconButton } from "../IconButton";

describe("IconButton", () => {
  it("applies variant token and size data attribute", () => {
    render(<IconButton variant="primary" size="md" aria-label="star">★</IconButton>);
    const btn = screen.getByLabelText("star");
    expect(btn).toHaveAttribute("data-token", "--color-primary");
    expect(btn).toHaveAttribute("data-size", "md");
  });

  it("supports quiet variant", () => {
    render(<IconButton variant="quiet" aria-label="quiet">★</IconButton>);
    const btn = screen.getByLabelText("quiet");
    expect(btn).toHaveAttribute("data-token", "--color-accent");
    expect(btn.className).toContain("hover:bg-transparent");
  });
});
