import { render, screen } from "@testing-library/react";
import TestimonialSlider from "../components/cms/blocks/TestimonialSlider";

describe("TestimonialSlider", () => {
  it("shows first testimonial", () => {
    render(
      <TestimonialSlider
        testimonials={[
          { quote: "Great", name: "A" },
          { quote: "Nice", name: "B" },
        ]}
      />
    );
    expect(screen.getByText("Great")).toBeInTheDocument();
  });
});
