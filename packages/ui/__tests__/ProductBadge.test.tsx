import React from "react";
import { render, screen } from "@testing-library/react";
import { ProductBadge } from "../src/components/atoms/ProductBadge";

describe("ProductBadge", () => {
  it("applies variant tokens and classes", () => {
    const { rerender } = render(<ProductBadge label="Sale" variant="sale" />);
    let outer = screen.getByText("Sale").parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-danger");
    expect(outer.className).toMatch(/bg-danger/);
    expect(screen.getByText("Sale")).toHaveAttribute("data-token", "--color-danger-fg");

    rerender(<ProductBadge label="New" variant="new" />);
    outer = screen.getByText("New").parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-success");
    expect(screen.getByText("New")).toHaveClass("text-success-fg");

    rerender(<ProductBadge label="Regular" variant="default" />);
    outer = screen.getByText("Regular").parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-muted");
  });

  it("prefers explicit color overrides and soft tone by default", () => {
    const { rerender } = render(
      <ProductBadge label="Info" color="info" className="extra" />,
    );
    const infoInner = screen.getByText("Info");
    let outer = infoInner.parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-info-soft");
    expect(outer.className).toMatch(/bg-info-soft/);
    expect(infoInner).toHaveClass("text-fg");
    expect(outer.className).toMatch(/extra/);

    rerender(
      <ProductBadge label="Primary" color="primary" tone="solid" />,
    );
    const primaryInner = screen.getByText("Primary");
    outer = primaryInner.parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-primary");
    expect(outer.className).toMatch(/bg-primary(\s|$)/);
    expect(primaryInner).toHaveClass("text-primary-foreground");
  });

  it("uses provided tone even when variant is unset", () => {
    const badge = render(
      <ProductBadge
        variant={undefined}
        label="Custom"
        tone="soft"
      />,
    );
    const outer = badge.getByText("Custom").parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-muted");
    expect(outer.className).toMatch(/bg-muted/);
  });
});

