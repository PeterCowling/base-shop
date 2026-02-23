import * as React from "react";
import { render, screen } from "@testing-library/react";

import { LinkText } from "./LinkText";

describe("LinkText", () => {
  it("applies color classes and soft tone hover", () => {
    render(
      <div>
        <LinkText href="#" color="primary">Primary</LinkText>
        <LinkText href="#" color="danger" tone="soft">Danger</LinkText>
      </div>
    );
    const primary = screen.getByText("Primary");
    const danger = screen.getByText("Danger");
    expect(primary.className).toMatch(/text-primary/);
    expect(danger.className).toMatch(/hover:bg-danger-soft/);
  });

  it("supports soft shape/radius overrides", () => {
    const { rerender } = render(
      <LinkText href="#" tone="soft" softShape="square">
        Soft
      </LinkText>,
    );
    let soft = screen.getByText("Soft");
    expect(soft).toHaveClass("rounded-none");

    rerender(
      <LinkText href="#" tone="soft" softShape="square" softRadius="xl">
        Soft
      </LinkText>,
    );
    soft = screen.getByText("Soft");
    expect(soft).toHaveClass("rounded-xl");
  });
});
