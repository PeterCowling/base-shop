import { act,fireEvent, render, screen } from "@testing-library/react";

import ImageSlider from "../ImageSlider";

describe("ImageSlider", () => {
  it("renders first slide", () => {
    render(
      <ImageSlider
        slides={[
          { src: "/a.jpg", alt: "a" },
          { src: "/b.jpg", alt: "b" },
        ]}
      />
    );
    expect(screen.getByAltText("a")).toBeInTheDocument();
  });

  it("navigates next and previous slides", () => {
    render(
      <ImageSlider
        slides={[
          { src: "/a.jpg", alt: "a" },
          { src: "/b.jpg", alt: "b" },
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /next slide/i }));
    expect(screen.getByAltText("b")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /previous slide/i }));
    expect(screen.getByAltText("a")).toBeInTheDocument();
  });

  it("autoplays to next slide after interval", () => {
    jest.useFakeTimers();
    render(
      <ImageSlider
        slides={[
          { src: "/a.jpg", alt: "a" },
          { src: "/b.jpg", alt: "b" },
        ]}
      />
    );
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByAltText("b")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("returns null when below minItems", () => {
    const { container } = render(
      <ImageSlider slides={[{ src: "/a.jpg" }]} minItems={2} />
    );
    expect(container.firstChild).toBeNull();
  });
});
