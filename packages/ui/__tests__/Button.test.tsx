import { configure, fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/components/atoms/shadcn";

configure({ testIdAttribute: "data-testid" });

describe("Button", () => {
  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Press</Button>);
    const button = screen.getByRole("button", { name: "Press" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveTextContent("Press");
  });

  it("applies base and destructive classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("inline-flex");
    expect(button).toHaveClass("bg-destructive");
  });

  it("renders a custom element with Slot when asChild", () => {
    render(
      <Button variant="destructive" asChild>
        <a href="#" data-testid="custom-link">
          Delete
        </a>
      </Button>,
    );
    const link = screen.getByTestId("custom-link");
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveClass("inline-flex");
    expect(link).toHaveClass("bg-destructive");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("supports aria-label for accessibility", () => {
    render(<Button aria-label="Save changes" />);
    const button = screen.getByLabelText("Save changes");
    expect(button).toHaveAttribute("aria-label", "Save changes");
  });
});
