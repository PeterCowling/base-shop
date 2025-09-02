import { render, screen, act } from "@testing-library/react";
import TestimonialSlider from "../src/components/cms/blocks/TestimonialSlider";

describe("TestimonialSlider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

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

  it("returns null when below minItems", () => {
    const { container } = render(
      <TestimonialSlider testimonials={[{ quote: "Only" }]} minItems={2} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("clamps testimonials to maxItems", () => {
    render(
      <TestimonialSlider
        testimonials={[
          { quote: "Great", name: "A" },
          { quote: "Nice", name: "B" },
        ]}
        maxItems={1}
      />
    );
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(screen.queryByText("Nice")).not.toBeInTheDocument();
  });
});
