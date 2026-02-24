import "../../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { Button } from "../button";

describe("Button", () => {
  it("applies size classes for sm/md/lg", () => {
    const { rerender, container } = render(<Button size="sm">Small</Button>);
    expect(container.firstChild).toHaveClass("h-9", "px-3");

    rerender(<Button size="md">Medium</Button>);
    expect(container.firstChild).toHaveClass("h-10", "px-4");

    rerender(<Button size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass("h-11", "px-5", "text-base");
  });

  it("applies quiet tone styles", () => {
    const { container } = render(
      <Button tone="quiet" color="primary">
        Quiet
      </Button>,
    );
    expect(container.firstChild).toHaveClass("text-primary");
    expect(container.firstChild).toHaveClass("hover:bg-primary-soft/50");
  });

  it("supports shape and radius variants with radius precedence", () => {
    const { rerender, container } = render(
      <Button shape="square">Square</Button>,
    );
    expect(container.firstChild).toHaveClass("rounded-none");

    rerender(<Button shape="pill">Pill</Button>);
    expect(container.firstChild).toHaveClass("rounded-full");

    rerender(
      <Button shape="square" radius="2xl">
        Radius wins
      </Button>,
    );
    expect(container.firstChild).toHaveClass("rounded-2xl");
    expect(container.firstChild).not.toHaveClass("rounded-none");
  });

  it("uses style-neutral passthrough compatibility mode", () => {
    const { container } = render(
      <Button
        compatibilityMode="passthrough"
        className="caller-class"
        aria-label="Compat button"
      >
        Compat
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Compat button" });
    expect(button).toBe(container.firstChild);
    expect(button).toHaveClass("caller-class");
    expect(button).not.toHaveClass("h-10", "px-4", "bg-primary");
  });

  it("keeps disabled and loading semantics in passthrough mode", () => {
    render(
      <Button compatibilityMode="passthrough" aria-busy className="caller-class">
        Loading
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Loading" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("span[aria-hidden='true']")).toBeNull();
  });

  it("preserves loading semantics for asChild passthrough", () => {
    render(
      <Button compatibilityMode="passthrough" asChild aria-busy className="link-class">
        <a href="/demo">Go</a>
      </Button>,
    );

    const anchor = screen.getByRole("link", { name: "Go" });
    expect(anchor).toHaveClass("link-class");
    expect(anchor).toHaveAttribute("aria-busy", "true");
    expect(anchor).not.toHaveAttribute("disabled");
  });
});
