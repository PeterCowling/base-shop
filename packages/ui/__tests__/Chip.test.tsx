import { fireEvent, render, screen } from "@testing-library/react";
import { Chip } from "../components/atoms/Chip";
import { Tag } from "../components/atoms/Tag";

describe("Chip", () => {
  it("calls onRemove when remove button clicked", () => {
    const fn = jest.fn();
    render(<Chip onRemove={fn}>Label</Chip>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalled();
  });

  it("forwards extra class names via cn", () => {
    const { container } = render(<Chip className="extra">Text</Chip>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("extra");
  });
});

describe("Tag", () => {
  it("applies success variant classes", () => {
    const { container } = render(<Tag variant="success" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-success");
    expect(span.className).toContain("text-success-fg");
  });
});
