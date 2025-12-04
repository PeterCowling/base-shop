import "../../../../../../../test/resetNextMocks";
import { render } from "@testing-library/react";
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
      </Button>
    );
    expect(container.firstChild).toHaveClass("text-primary");
    expect(container.firstChild).toHaveClass("hover:bg-primary-soft/50");
  });
});
