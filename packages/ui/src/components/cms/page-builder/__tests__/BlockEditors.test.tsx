import { fireEvent, render, screen } from "@testing-library/react";
import ContactFormEditor from "../ContactFormEditor";
import GalleryEditor from "../GalleryEditor";
import ImageBlockEditor from "../ImageBlockEditor";
import TestimonialsEditor from "../TestimonialsEditor";
import HeroBannerEditor from "../HeroBannerEditor";
import ValuePropsEditor from "../ValuePropsEditor";
import ReviewsCarouselEditor from "../ReviewsCarouselEditor";
import VideoBlockEditor from "../VideoBlockEditor";

jest.mock("../ImagePicker", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

describe("block editors", () => {
  const cases: [string, React.ComponentType<any>, any, string][] = [
    [
      "ContactFormEditor",
      ContactFormEditor,
      { type: "ContactForm", action: "", method: "" },
      "action",
    ],
    [
      "ImageBlockEditor",
      ImageBlockEditor,
      { type: "Image", src: "", alt: "" },
      "alt",
    ],
    [
      "GalleryEditor",
      GalleryEditor,
      { type: "Gallery", images: [{ src: "", alt: "" }] },
      "src",
    ],
    [
      "TestimonialsEditor",
      TestimonialsEditor,
      { type: "Testimonials", testimonials: [{ quote: "", name: "" }] },
      "quote",
    ],
    [
      "HeroBannerEditor",
      HeroBannerEditor,
      {
        type: "HeroBanner",
        slides: [{ src: "", alt: "", headlineKey: "", ctaKey: "" }],
      },
      "src",
    ],
    [
      "ValuePropsEditor",
      ValuePropsEditor,
      { type: "ValueProps", items: [{ icon: "", title: "", desc: "" }] },
      "icon",
    ],
    [
      "ReviewsCarouselEditor",
      ReviewsCarouselEditor,
      { type: "ReviewsCarousel", reviews: [{ nameKey: "", quoteKey: "" }] },
      "nameKey",
    ],
    [
      "VideoBlockEditor",
      VideoBlockEditor,
      { type: "VideoBlock", src: "", autoplay: false },
      "Video URL",
    ],
  ];

  it.each(cases)("%s triggers onChange", (_name, Comp, component, placeholder) => {
    const onChange = jest.fn();
    render(<Comp component={component} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(placeholder), {
      target: { value: "x" },
    });
    expect(onChange).toHaveBeenCalled();
  });
});
