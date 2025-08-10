import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "../components/atoms/shadcn";

describe("Button", () => {
  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Press</Button>);
    const button = screen.getByRole("button", { name: "Press" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveTextContent("Press");
  });

  it("applies destructive variant styling", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive");
  });

  it("supports aria-label for accessibility", () => {
    render(<Button aria-label="Save changes" />);
    const button = screen.getByLabelText("Save changes");
    expect(button).toHaveAttribute("aria-label", "Save changes");
  });
});
