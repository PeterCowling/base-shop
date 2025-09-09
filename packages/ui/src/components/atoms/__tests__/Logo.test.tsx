import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Logo } from "../Logo";

describe("Logo", () => {
  it("selects the appropriate image source based on viewport", () => {
    // Mock matchMedia for a narrow viewport
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width: 500px"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <Logo
        src="/logo-large.png"
        fallbackText="Shop"
        sources={[
          { srcSet: "/logo-small.png", media: "(max-width: 500px)" },
          { srcSet: "/logo-large.png", media: "(min-width: 501px)" },
        ]}
      />
    );

    const picture = screen.getByRole("img").parentElement as HTMLPictureElement;
    const selected = Array.from(picture.querySelectorAll("source")).find((s) =>
      window.matchMedia(s.media).matches
    );
    expect(selected).toBeDefined();
    expect(selected?.getAttribute("srcset")).toBe("/logo-small.png");
  });

  it("renders an image with alt defaulting to fallback text", () => {
    render(<Logo src="/logo.png" fallbackText="Shop" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Shop");
    expect(img).toHaveAttribute("src", "/logo.png");
  });

  it("renders fallback text when src is undefined", () => {
    render(<Logo src={undefined} fallbackText="Shop" />);
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });
});
