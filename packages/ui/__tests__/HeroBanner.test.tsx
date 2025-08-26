import { render, screen, fireEvent, act } from "@testing-library/react";
import HeroBanner, { type Slide } from "../src/components/home/HeroBanner";

const translations: Record<string, string> = {};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from "next/navigation";
const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

beforeEach(() => {
  jest.useFakeTimers();
  mockPathname.mockReturnValue("/en");
  Object.keys(translations).forEach((k) => delete translations[k]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("HeroBanner", () => {
  it("renders default slides and auto advances", () => {
    Object.assign(translations, {
      "hero.slide1.headline": "Slide One",
      "hero.slide2.headline": "Slide Two",
      "hero.cta": "Shop now",
    });

    const { container } = render(<HeroBanner />);
    expect(screen.getByText("Slide One")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Shop now" });
    expect(link).toHaveAttribute("href", "/en/shop");
    expect(link).toHaveAttribute("data-token", "--color-fg");
    expect(link.querySelector("span")).toHaveAttribute(
      "data-token",
      "--color-bg"
    );
    expect(
      container.querySelector('button[aria-label="Previous slide"]')
    ).toHaveAttribute("data-token", "--color-fg");

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(screen.getByText("Slide Two")).toBeInTheDocument();
  });

  it("uses navigation buttons with provided slides", () => {
    const slides: Slide[] = [
      { src: "/a.jpg", alt: "a", headlineKey: "a.head", ctaKey: "a.cta" },
      { src: "/b.jpg", alt: "b", headlineKey: "b.head", ctaKey: "b.cta" },
    ];
    Object.assign(translations, {
      "a.head": "Alpha",
      "a.cta": "Buy A",
      "b.head": "Beta",
      "b.cta": "Buy B",
    });

    render(<HeroBanner slides={slides} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("Beta")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Buy A" })
    ).toHaveAttribute("href", "/en/shop");
  });
});

