import "../../../../../../../test/resetNextMocks";

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Inline } from "../Inline";

describe("Inline", () => {
  // TC-07: renders div by default
  it("renders a div by default", () => {
    render(<Inline data-cy="inline">Content</Inline>);
    const el = screen.getByTestId("inline");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("flex");
  });

  // TC-08: asChild renders child element
  it("renders child element with asChild", () => {
    render(
      <Inline asChild data-cy="inline">
        <nav>Links</nav>
      </Inline>
    );
    const el = screen.getByTestId("inline");
    expect(el.tagName).toBe("NAV");
    expect(el).toHaveClass("flex");
  });

  // gap prop
  it("applies gap class", () => {
    render(<Inline gap={4} data-cy="inline">Content</Inline>);
    expect(screen.getByTestId("inline")).toHaveClass("gap-4");
  });

  // alignY prop
  it("applies alignY class", () => {
    render(<Inline alignY="baseline" data-cy="inline">Content</Inline>);
    expect(screen.getByTestId("inline")).toHaveClass("items-baseline");
  });

  // wrap=false
  it("uses flex-nowrap when wrap is false", () => {
    render(<Inline wrap={false} data-cy="inline">Content</Inline>);
    expect(screen.getByTestId("inline")).toHaveClass("flex-nowrap");
  });

  // asChild merges className
  it("merges className when asChild is used", () => {
    render(
      <Inline asChild className="custom">
        <span className="span-class" data-cy="inline">Text</span>
      </Inline>
    );
    const el = screen.getByTestId("inline");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("flex", "custom", "span-class");
  });

  // TC-10: ref forwarding
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Inline ref={ref}>Content</Inline>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  // TC-09: accessibility
  it("passes jest-axe", async () => {
    const { container } = render(<Inline>Content</Inline>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
