import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { IconButton } from "../IconButton";

describe("IconButton", () => {
  it("applies variant token and size data attribute", async () => {
    const { container } = render(<IconButton variant="primary" size="md" aria-label="star">★</IconButton>);
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

  it("applies shape and radius overrides", () => {
    const { rerender } = render(
      <IconButton shape="square" aria-label="square">★</IconButton>,
    );
    expect(screen.getByLabelText("square").className).toContain("rounded-none");

    rerender(
      <IconButton shape="square" radius="lg" aria-label="square">★</IconButton>,
    );
    expect(screen.getByLabelText("square").className).toContain("rounded-lg");
  });
});
