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

  it("returns null when below minItems", () => {
    const { container } = render(
      <Testimonials testimonials={[{ quote: "A", name: "A" }]} minItems={2} />
    );
    expect(container.firstChild).toBeNull();
  });
});
