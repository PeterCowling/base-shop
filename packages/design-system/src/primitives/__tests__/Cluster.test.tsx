import "../../../../../../../test/resetNextMocks";

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Cluster } from "../Cluster";

describe("Cluster", () => {
  // TC-04: renders div by default
  it("renders a div by default with flex-wrap", () => {
    render(<Cluster data-cy="cluster">Content</Cluster>);
    const el = screen.getByTestId("cluster");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("flex", "flex-wrap");
  });

  // TC-05: asChild renders child element
  it("renders child element with asChild", () => {
    render(
      <Cluster asChild data-cy="cluster">
        <ul>Content</ul>
      </Cluster>
    );
    const el = screen.getByTestId("cluster");
    expect(el.tagName).toBe("UL");
    expect(el).toHaveClass("flex", "flex-wrap");
  });

  // TC-06: gap prop
  it("applies gap class", () => {
    render(<Cluster gap={4} data-cy="cluster">Content</Cluster>);
    expect(screen.getByTestId("cluster")).toHaveClass("gap-4");
  });

  // alignY prop
  it("applies alignY class", () => {
    render(<Cluster alignY="end" data-cy="cluster">Content</Cluster>);
    expect(screen.getByTestId("cluster")).toHaveClass("items-end");
  });

  // justify prop
  it("applies justify class", () => {
    render(<Cluster justify="between" data-cy="cluster">Content</Cluster>);
    expect(screen.getByTestId("cluster")).toHaveClass("justify-between");
  });

  // wrap=false
  it("uses flex-nowrap when wrap is false", () => {
    render(<Cluster wrap={false} data-cy="cluster">Content</Cluster>);
    expect(screen.getByTestId("cluster")).toHaveClass("flex-nowrap");
    expect(screen.getByTestId("cluster")).not.toHaveClass("flex-wrap");
  });

  // asChild merges className
  it("merges className when asChild is used", () => {
    render(
      <Cluster asChild className="custom">
        <nav className="nav-class" data-cy="cluster">Links</nav>
      </Cluster>
    );
    const el = screen.getByTestId("cluster");
    expect(el.tagName).toBe("NAV");
    expect(el).toHaveClass("flex", "custom", "nav-class");
  });

  // ref forwarding
  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Cluster ref={ref}>Content</Cluster>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  // TC-09: accessibility
  it("passes jest-axe", async () => {
    const { container } = render(<Cluster>Content</Cluster>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
