import React from "react";
import { render } from "@testing-library/react";
import { Card, CardContent } from "../src/components/atoms/primitives/card";

describe("Card primitives", () => {
  it("Card carries data-token and merges className; CardContent applies padding", () => {
    const { container } = render(
      <Card className="custom"><CardContent className="inner" /></Card>
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-bg");
    expect(outer.className).toMatch(/custom/);
    const inner = outer.querySelector(".inner");
    expect(inner).not.toBeNull();
    expect((inner as HTMLElement).className).toMatch(/p-6/);
  });
});

