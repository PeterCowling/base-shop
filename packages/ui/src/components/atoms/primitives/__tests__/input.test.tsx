import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "../input";

describe("Input primitive", () => {
  it("applies wrapper class to outer div", () => {
    const { container } = render(<Input wrapperClassName="custom-wrapper" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("custom-wrapper");
  });

  it("renders without floating label and applies error styles", () => {
    render(<Input label="Email" error="Required" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveClass("border-red-500");
    expect(input).toHaveAttribute("aria-invalid", "true");

    // exercise focus/blur handlers
    fireEvent.focus(input);
    fireEvent.blur(input);
  });

  it("handles floating label focus and blur", () => {
    render(<Input label="Email" floatingLabel />);
    const input = screen.getByLabelText("Email");
    const label = screen.getByText("Email");

    expect(label).not.toHaveClass("-translate-y-3 text-xs");
    fireEvent.focus(input);
    expect(label).toHaveClass("-translate-y-3 text-xs");
    fireEvent.blur(input);
    expect(label).not.toHaveClass("-translate-y-3 text-xs");
  });

  it("treats controlled value as having content", () => {
    render(
      <Input label="Email" floatingLabel value="foo" onChange={() => {}} />
    );
    const label = screen.getByText("Email");
    expect(label).toHaveClass("-translate-y-3 text-xs");
  });

  it("treats default value as having content", () => {
    render(<Input label="Email" floatingLabel defaultValue="bar" />);
    const label = screen.getByText("Email");
    expect(label).toHaveClass("-translate-y-3 text-xs");
  });
});
