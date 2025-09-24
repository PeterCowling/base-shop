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
    expect(input).toHaveClass("border-danger");
    expect(input).toHaveAttribute("aria-invalid", "true");

    // exercise focus/blur handlers
    fireEvent.focus(input);
    fireEvent.blur(input);
  });

  it("updates aria-invalid when error toggles", () => {
    const { rerender } = render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).not.toHaveAttribute("aria-invalid");

    rerender(<Input label="Email" error="Required" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    rerender(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  describe("floatingLabel", () => {
    it("floats label when controlled value is provided", () => {
      render(
        <Input label="Email" floatingLabel value="foo" onChange={() => {}} />,
      );
      const label = screen.getByText("Email");
      expect(label).toHaveClass("-translate-y-3 text-xs");
    });

    it("floats label when defaultValue is provided", () => {
      render(<Input label="Email" floatingLabel defaultValue="bar" />);
      const label = screen.getByText("Email");
      expect(label).toHaveClass("-translate-y-3 text-xs");
    });

    it("does not float label when no value is provided", () => {
      render(<Input label="Email" floatingLabel />);
      const label = screen.getByText("Email");
      expect(label).not.toHaveClass("-translate-y-3 text-xs");
    });
  });

  it("omits label when floatingLabel is set without label", () => {
    const { container } = render(<Input floatingLabel />);
    expect(container.querySelector("label")).toBeNull();
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

  it("handles focus and blur without custom callbacks", () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    const focusSpy = jest.fn();
    const blurSpy = jest.fn();
    input.addEventListener("focus", focusSpy);
    input.addEventListener("blur", blurSpy);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(blurSpy).toHaveBeenCalledTimes(1);
  });

  it("allows custom id to override generated id", () => {
    render(<Input label="Email" id="custom-id" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "custom-id");
  });
});
