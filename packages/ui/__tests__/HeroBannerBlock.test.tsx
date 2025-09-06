import { render, screen } from "@testing-library/react";
import CmsHeroBanner from "../src/components/cms/blocks/HeroBanner";

const heroMock = jest.fn(() => <div data-testid="hero" />);
jest.mock("../src/components/home/HeroBanner.client", () => ({
  __esModule: true,
  default: (props: any) => {
    heroMock(props);
    return <div data-testid="hero" />;
  },
}));

describe("CmsHeroBanner", () => {
  beforeEach(() => heroMock.mockClear());

  it("renders HeroBanner with limited slides", () => {
    const slides = [
      { src: "a.jpg", alt: "a", headlineKey: "h1", ctaKey: "c1" },
      { src: "b.jpg", alt: "b", headlineKey: "h2", ctaKey: "c2" },
      { src: "c.jpg", alt: "c", headlineKey: "h3", ctaKey: "c3" },
    ];
    render(<CmsHeroBanner slides={slides} minItems={1} maxItems={2} />);
    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(heroMock).toHaveBeenCalled();
    expect(heroMock.mock.calls[0][0].slides).toHaveLength(2);
  });

  it("returns null when slides below minimum", () => {
    const slides = [
      { src: "a.jpg", alt: "a", headlineKey: "h1", ctaKey: "c1" },
    ];
    const { container } = render(
      <CmsHeroBanner slides={slides} minItems={2} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
