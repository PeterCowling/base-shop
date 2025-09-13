import { render, screen } from "@testing-library/react";
import Testimonials from "../src/components/cms/blocks/Testimonials";

describe("Testimonials", () => {
  it("clamps to maxItems", () => {
    render(
      <Testimonials
        testimonials={[
          { quote: "A", name: "A" },
          { quote: "B", name: "B" },
        ]}
        maxItems={1}
      />
    );
    expect(screen.getByText(/A/, { selector: "footer" })).toBeInTheDocument();
    expect(screen.queryByText(/B/)).not.toBeInTheDocument();
  });

  it("renders testimonials with missing fields", () => {
    const { container } = render(
      <Testimonials
        testimonials={[
          { quote: "Only quote" },
          { name: "Only name" } as any,
        ]}
      />
    );
    // Both testimonials should render without crashing
    expect(container.querySelectorAll("blockquote")).toHaveLength(2);
    expect(screen.getByText(/Only quote/)).toBeInTheDocument();
    expect(
      screen.getByText(/Only name/, { selector: "footer" })
    ).toBeInTheDocument();
  });

  it("returns null when list is empty", () => {
    const { container } = render(<Testimonials testimonials={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when below minItems", () => {
    const { container } = render(
      <Testimonials testimonials={[{ quote: "A", name: "A" }]} minItems={2} />
    );
    expect(container.firstChild).toBeNull();
  });
});
