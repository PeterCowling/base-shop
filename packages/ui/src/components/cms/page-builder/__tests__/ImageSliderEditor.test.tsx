import { fireEvent, render, screen } from "@testing-library/react";
import ImageSliderEditor from "../ImageSliderEditor";

jest.mock("../ImagePicker", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

describe("ImageSliderEditor", () => {
  const baseSlide = { src: "", alt: "", caption: "" };

  it("adds a slide and disables add at max", () => {
    const onChange = jest.fn();
    const component = { type: "ImageSlider", slides: [baseSlide], maxItems: 2 } as any;
    const { rerender } = render(
      <ImageSliderEditor component={component} onChange={onChange} />
    );

    fireEvent.click(screen.getByText("Add"));
    expect(onChange).toHaveBeenLastCalledWith({ slides: [baseSlide, baseSlide] });

    rerender(
      <ImageSliderEditor
        component={{ ...component, slides: [baseSlide, baseSlide], maxItems: 2 }}
        onChange={onChange}
      />
    );
    expect(screen.getByText("Add")).toBeDisabled();
  });

  it("removes a slide and disables remove at min", () => {
    const onChange = jest.fn();
    const slides = [{ ...baseSlide }, { ...baseSlide }];
    const component = { type: "ImageSlider", slides, minItems: 1 } as any;
    const { rerender } = render(
      <ImageSliderEditor component={component} onChange={onChange} />
    );

    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(onChange).toHaveBeenLastCalledWith({ slides: [slides[1]] });

    rerender(
      <ImageSliderEditor
        component={{ ...component, slides: [slides[0]], minItems: 1 }}
        onChange={onChange}
      />
    );
    expect(screen.getByText("Remove")).toBeDisabled();
  });

  it("moves slides", () => {
    const onChange = jest.fn();
    const slides = [{ src: "1" }, { src: "2" }];
    const component = { type: "ImageSlider", slides } as any;
    render(<ImageSliderEditor component={component} onChange={onChange} />);

    fireEvent.click(screen.getAllByText("Down")[0]);
    expect(onChange).toHaveBeenLastCalledWith({ slides: [slides[1], slides[0]] });
  });

  it("updates fields via onChange", () => {
    const onChange = jest.fn();
    const slides = [{ ...baseSlide }];
    const component = { type: "ImageSlider", slides } as any;
    render(<ImageSliderEditor component={component} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("src"), {
      target: { value: "new" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ slides: [{ src: "new", alt: "", caption: "" }] });
  });
});
