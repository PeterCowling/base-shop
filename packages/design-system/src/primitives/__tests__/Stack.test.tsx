import "../../../../../../../test/resetNextMocks";

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Stack } from "../Stack";

describe("Stack", () => {
  // TC-01: renders div by default
  it("renders a div by default", () => {
    render(<Stack data-cy="stack">Content</Stack>);
    const el = screen.getByTestId("stack");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("flex", "flex-col");
  });

  // TC-02: asChild renders child element
  it("renders child element with asChild", () => {
    render(
      <Stack asChild data-cy="stack">
        <section>Content</section>
      </Stack>
    );
    const el = screen.getByTestId("stack");
    expect(el.tagName).toBe("SECTION");
    expect(el).toHaveClass("flex", "flex-col");
  });

  // TC-03: asChild merges className
  it("merges className when asChild is used", () => {
    render(
      <Stack asChild className="custom-class">
        <section className="child-class" data-cy="stack">Content</section>
      </Stack>
    );
    const el = screen.getByTestId("stack");
    expect(el).toHaveClass("flex", "flex-col", "custom-class", "child-class");
  });

  // gap prop
  it("applies gap class", () => {
    render(<Stack gap={6} data-cy="stack">Content</Stack>);
    expect(screen.getByTestId("stack")).toHaveClass("gap-6");
  });

  // align prop
  it("applies alignment class", () => {
    render(<Stack align="center" data-cy="stack">Content</Stack>);
    expect(screen.getByTestId("stack")).toHaveClass("items-center");
  });

  // TC-10: ref forwarding
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref}>Content</Stack>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  // TC-09: accessibility
  it("passes jest-axe", async () => {
    const { container } = render(<Stack>Content</Stack>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
