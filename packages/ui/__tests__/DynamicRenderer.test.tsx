import { render, screen } from "@testing-library/react";
import type { PageComponent } from "@types";
import DynamicRenderer from "../src/components/DynamicRenderer";
import { blockRegistry, type BlockType } from "../src/components/cms/blocks";

const productGridProps = jest.fn();
function stub(name: string) {
  return () => <div>{name}</div>;
}

jest.mock("@/components/home/HeroBanner", () => ({
  __esModule: true,
  default: stub("HeroBanner"),
}));
jest.mock("@/components/home/ReviewsCarousel", () => ({
  __esModule: true,
  default: stub("ReviewsCarousel"),
}));
jest.mock("@/components/home/ValueProps", () => ({
  __esModule: true,
  ValueProps: stub("ValueProps"),
}));
jest.mock("@/components/cms/blocks/BlogListing", () => ({
  __esModule: true,
  default: stub("BlogListing"),
}));
jest.mock("@/components/cms/blocks/ContactForm", () => ({
  __esModule: true,
  default: stub("ContactForm"),
}));
jest.mock("@/components/cms/blocks/ContactFormWithMap", () => ({
  __esModule: true,
  default: stub("ContactFormWithMap"),
}));
jest.mock("@/components/cms/blocks/Gallery", () => ({
  __esModule: true,
  default: stub("Gallery"),
}));
jest.mock("@/components/cms/blocks/Testimonials", () => ({
  __esModule: true,
  default: stub("Testimonials"),
}));
jest.mock("@/components/cms/blocks/TestimonialSlider", () => ({
  __esModule: true,
  default: stub("TestimonialSlider"),
}));
jest.mock("@/components/cms/blocks/ProductCarousel", () => ({
  __esModule: true,
  default: stub("ProductCarousel"),
}));
jest.mock("@/components/cms/blocks/molecules", () => ({
  __esModule: true,
  NewsletterForm: stub("NewsletterForm"),
  PromoBanner: stub("PromoBanner"),
  CategoryList: stub("CategoryList"),
}));
jest.mock("@platform-core/src/components/shop/ProductGrid", () => ({
  ProductGrid: (props: any) => {
    productGridProps(props);
    return stub("ProductGrid")();
  },
}));
jest.mock("@/components/cms/blocks", () => {
  const actual = jest.requireActual("@/components/cms/blocks");
  return {
    __esModule: true,
    ...actual,
    Image: stub("Image"),
  };
});

function createComponent(type: BlockType): PageComponent {
  switch (type) {
    case "Text":
      return {
        id: "1",
        type,
        text: { en: type },
        locale: "en",
      } as any;
    case "Image":
      return { id: "1", type, src: "/img.png", alt: "" } as any;
    case "Section":
      return { id: "1", type, children: [] } as any;
    default:
      return { id: "1", type } as any;
  }
}

beforeEach(() => {
  productGridProps.mockClear();
});

describe("DynamicRenderer", () => {
  it("warns on unknown component type", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const components = [{ id: "1", type: "Unknown" } as PageComponent];

    render(<DynamicRenderer components={components} />);

    expect(warnSpy).toHaveBeenCalledWith("Unknown component type: Unknown");
    warnSpy.mockRestore();
  });

  it("renders a nested Section with child blocks", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Section",
        children: [
          { id: "2", type: "Text", text: { en: "inner" }, locale: "en" } as any,
        ],
      } as any,
    ];

    render(<DynamicRenderer components={components} />);

    expect(screen.getByText("inner")).toBeInTheDocument();
  });

  it("passes runtime props to ProductGrid", () => {
    const components: PageComponent[] = [
      { id: "1", type: "ProductGrid" } as any,
    ];

    render(<DynamicRenderer components={components} />);

    expect(productGridProps).toHaveBeenCalledWith(
      expect.objectContaining({ skus: expect.any(Array) })
    );
  });

  it("renders locale-specific text", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Text",
        text: { en: "hello", fr: "bonjour" },
        locale: "fr",
      } as any,
    ];

    render(<DynamicRenderer components={components} />);

    expect(screen.getByText("bonjour")).toBeInTheDocument();
  });

  describe.each(Object.keys(blockRegistry))("%s block", (type) => {
    it("renders without warning", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const component = createComponent(type as BlockType);

      render(<DynamicRenderer components={[component]} />);

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});

