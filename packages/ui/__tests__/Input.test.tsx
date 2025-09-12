import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "../src/components/atoms/shadcn";

describe("Input", () => {
  it("handles change, focus and blur events", () => {
    const handleChange = jest.fn();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    render(
      <Input
        label="Name"
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
    const input = screen.getByLabelText("Name");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Alice" } });
    fireEvent.blur(input);
    expect(handleFocus).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalled();
    expect(handleBlur).toHaveBeenCalled();
    expect(input).toHaveAttribute("data-token", "--color-bg");
  });

  it("applies error styles and accessibility attributes", () => {
    render(<Input aria-label="email" error="Required" />);
    const input = screen.getByLabelText("email");
    expect(input).toHaveClass("border-red-500");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toHaveTextContent("Required");
  });

  it("renders without floating label classes and merges custom className", () => {
    render(<Input className="custom" />);
    const input = screen.getByRole("textbox");
    expect(input).not.toHaveClass("peer");
    expect(input).not.toHaveClass("pt-5");
    expect(input).toHaveClass("custom");
    expect(input).toHaveClass("flex");
  });
});
