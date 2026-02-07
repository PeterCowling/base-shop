import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { ProductBadge } from "../ProductBadge";

describe("ProductBadge", () => {
  const variants = ["default", "sale", "new"] as const;
  const bgClasses = {
    default: "bg-muted",
    sale: "bg-danger",
    new: "bg-success",
  } as const;
  const bgTokens = {
    default: "--color-muted",
    sale: "--color-danger",
    new: "--color-success",
  } as const;
  const textClasses = {
    default: "text-fg",
    sale: "text-danger-foreground",
    new: "text-success-fg",
  } as const;
  const textTokens = {
    default: "--color-fg",
    sale: "--color-danger-fg",
    new: "--color-success-fg",
  } as const;

  it.each(variants)("applies %s variant styles", (variant) => {
    render(<ProductBadge label="Label" variant={variant} />);
    const inner = screen.getByText("Label");
    const outer = inner.parentElement as HTMLElement;
    expect(outer).toHaveClass(bgClasses[variant]);
    expect(outer).toHaveAttribute("data-token", bgTokens[variant]);
    expect(inner).toHaveClass(textClasses[variant]);
    expect(inner).toHaveAttribute("data-token", textTokens[variant]);
  });
});

