import { render, screen, fireEvent } from "@testing-library/react";
import RecommendationCarouselEditor from "../RecommendationCarouselEditor";

describe("RecommendationCarouselEditor", () => {
  it("updates endpoint input", () => {
    const onChange = jest.fn();
    render(<RecommendationCarouselEditor component={{ type: "RecommendationCarousel", endpoint: "" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Endpoint"), { target: { value: "api" } });
    expect(onChange).toHaveBeenCalledWith({ endpoint: "api" });
  });

  const fields: Array<[string, string]> = [
    ["Desktop Items", "desktopItems"],
    ["Tablet Items", "tabletItems"],
    ["Mobile Items", "mobileItems"],
  ];

  it.each(fields)("%s converts numeric strings to numbers", (label, field) => {
    const onChange = jest.fn();
    render(<RecommendationCarouselEditor component={{ type: "RecommendationCarousel" } as any} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(label), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith({ [field]: 5 });
  });

  it.each(fields)("%s blank strings yield undefined", (label, field) => {
    const onChange = jest.fn();
    render(
      <RecommendationCarouselEditor
        component={{ type: "RecommendationCarousel", [field]: 3 } as any}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText(label), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ [field]: undefined });
  });
});
