import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "../components/atoms/shadcn";

describe("Input", () => {
  it("handles change events", () => {
    const handleChange = jest.fn();
    render(<Input label="Name" onChange={handleChange} />);
    const input = screen.getByLabelText("Name");
    fireEvent.change(input, { target: { value: "Alice" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("applies error styles and accessibility attributes", () => {
    render(<Input aria-label="email" error="Required" />);
    const input = screen.getByLabelText("email");
    expect(input).toHaveClass("border-red-500");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toHaveTextContent("Required");
  });
});
