import "../../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { ScrollArea } from "../scroll-area";

describe("ScrollArea", () => {
  // TC-01: Renders children
  it("renders children content", async () => {
    render(
      <ScrollArea>
        <p>Scrollable content</p>
      </ScrollArea>
    );
    expect(screen.getByText("Scrollable content")).toBeInTheDocument();
  });

  // TC-02: Custom className merges
  it("merges custom className on root", () => {
    const { container } = render(
      <ScrollArea className="h-48 w-full" data-testid="scroll">
        <p>Content</p>
      </ScrollArea>
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("relative", "overflow-hidden", "h-48", "w-full");

  });

  // TC-03: Has viewport element
  it("renders viewport element", () => {
    const { container } = render(
      <ScrollArea>
        <p>Content</p>
      </ScrollArea>
    );
    // Radix scroll area renders viewport with data-radix-scroll-area-viewport
    const viewport = container.querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).toBeInTheDocument();
  });
});
