import "../../../../../../../test/resetNextMocks";

import { fireEvent,render, screen } from "@testing-library/react";

import { Textarea } from "../textarea";

describe("Textarea", () => {
  it("applies wrapper class to outer div", () => {
    const { container } = render(
      <Textarea wrapperClassName="custom-wrapper" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("custom-wrapper");
  });

  it("renders label above textarea in standard mode and merges className", () => {
    const { container } = render(
      <Textarea label="Notes" className="custom" />
    );
    const label = screen.getByText("Notes");
    const textarea = screen.getByRole("textbox");

    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveTextContent("Notes");
    expect(label).toHaveClass("text-sm", "font-medium", "text-foreground");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveClass("min-h-[6rem]", "custom");
  });

  it("omits label when floatingLabel is set without label", () => {
    const { container } = render(<Textarea floatingLabel />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.querySelector("label")).toBeNull();
  });

  it("renders floating label that toggles on focus and blur", () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    const { container } = render(
      <Textarea
        label="Message"
        floatingLabel
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
    const textarea = screen.getByRole("textbox");
    const label = screen.getByText("Message");

    expect(label).toHaveClass("absolute", "top-2", "left-3");
    expect(label).not.toHaveClass("-translate-y-3", "text-xs");

    fireEvent.focus(textarea);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    expect(label).toHaveClass("-translate-y-3", "text-xs");

    fireEvent.blur(textarea);
    expect(handleBlur).toHaveBeenCalledTimes(1);
    expect(label).not.toHaveClass("-translate-y-3", "text-xs");
  });

  it("applies error class and message", () => {
    render(<Textarea error="Required" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("border-danger");
    expect(textarea).toHaveAttribute("aria-invalid", "true");

    const error = screen.getByText("Required");
    expect(error).toHaveClass("text-danger");
    expect(error).not.toHaveAttribute("data-token");
  });

  it("toggles aria-invalid when error prop changes", () => {
    const { rerender } = render(<Textarea />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).not.toHaveAttribute("aria-invalid");

    rerender(<Textarea error="Required" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");

    rerender(<Textarea />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("calls onFocus and onBlur callbacks", () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    render(
      <Textarea onFocus={handleFocus} onBlur={handleBlur} />
    );
    const textarea = screen.getByRole("textbox");

    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    expect(handleFocus).toHaveBeenCalledTimes(1);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  describe("floating label", () => {
    it("floats label when controlled value is set", () => {
      render(
        <Textarea
          label="Message"
          floatingLabel
          value="Hello"
          onChange={() => {}}
        />
      );
      const label = screen.getByText("Message");
      expect(label).toHaveClass("-translate-y-3", "text-xs");
    });

    it("floats label when defaultValue is set", () => {
      render(<Textarea label="Message" floatingLabel defaultValue="Hi" />);
      const label = screen.getByText("Message");
      expect(label).toHaveClass("-translate-y-3", "text-xs");
    });
  });
});
