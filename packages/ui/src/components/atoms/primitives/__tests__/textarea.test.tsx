import "../../../../../../../test/resetNextMocks";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "../textarea";

describe("Textarea", () => {
  it("renders label above textarea in standard mode", () => {
    const { container } = render(<Textarea label="Notes" />);
    const wrapper = container.firstChild as HTMLElement;
    const [label, textarea] = wrapper.children;

    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveTextContent("Notes");
    expect(label).toHaveClass("mb-1", "block", "text-sm", "font-medium");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("renders floating label that moves on focus", () => {
    const { container } = render(
      <Textarea label="Message" floatingLabel />
    );
    const wrapper = container.firstChild as HTMLElement;
    const [textarea, label] = wrapper.children;

    expect(label).toHaveClass("absolute", "top-2", "left-3");
    expect(label).not.toHaveClass("-translate-y-3", "text-xs");

    fireEvent.focus(textarea);
    expect(label).toHaveClass("-translate-y-3", "text-xs");
  });

  it("applies error class and message", () => {
    render(<Textarea error="Required" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("border-red-500");
    expect(textarea).toHaveAttribute("aria-invalid", "true");

    const error = screen.getByText("Required");
    expect(error).toHaveClass("text-danger");
    expect(error).toHaveAttribute("data-token", "--color-danger");
  });

  it("floats label when controlled value is set", () => {
    render(<Textarea label="Message" floatingLabel value="Hello" />);
    const label = screen.getByText("Message");
    expect(label).toHaveClass("-translate-y-3", "text-xs");
  });

  it("floats label when defaultValue is set", () => {
    render(<Textarea label="Message" floatingLabel defaultValue="Hi" />);
    const label = screen.getByText("Message");
    expect(label).toHaveClass("-translate-y-3", "text-xs");
  });
});

