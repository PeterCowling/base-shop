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

  it("fires provided focus and blur callbacks", () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    render(
      <Input label="Email" onFocus={handleFocus} onBlur={handleBlur} />
    );

    const input = screen.getByLabelText("Email");
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("omits aria-invalid when there is no error", () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("allows custom id to override generated id", () => {
    render(<Input label="Email" id="custom-id" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "custom-id");
  });
});
