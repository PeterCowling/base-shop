import "../../../../../../../test/resetNextMocks";

import { render } from "@testing-library/react";
import { axe } from "jest-axe";

import { Button } from "../button";

describe("Button", () => {
  it("applies size classes for sm/md/lg", async () => {
    const { rerender, container } = render(<Button size="sm">Small</Button>);
    expect(container.firstChild).toHaveClass("h-9", "px-3");

    rerender(<Button size="md">Medium</Button>);
    expect(container.firstChild).toHaveClass("h-10", "px-4");

    rerender(<Button size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass("h-11", "px-5", "text-base");
  });

  it("applies quiet tone styles", async () => {
    const { container } = render(
      <Button tone="quiet" color="primary">
        Quiet
      </Button>
    );
    expect(container.firstChild).toHaveClass("text-primary");
    expect(container.firstChild).toHaveClass("hover:bg-primary-soft/50");

  });

  it("supports shape and radius variants with radius precedence", () => {
    const { rerender, container } = render(<Button shape="square">Square</Button>);
    expect(container.firstChild).toHaveClass("rounded-none");

    rerender(<Button shape="pill">Pill</Button>);
    expect(container.firstChild).toHaveClass("rounded-full");

    rerender(
      <Button shape="square" radius="2xl">
        Radius wins
      </Button>
    );
    expect(container.firstChild).toHaveClass("rounded-2xl");
    expect(container.firstChild).not.toHaveClass("rounded-none");
  });
});
