import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import useViewport from "../../hooks/useViewport";
import { Logo } from "../Logo";

jest.mock("../../hooks/useViewport");
const mockedUseViewport = useViewport as jest.Mock;
const sources = {
  mobile: { src: "/logo-mobile.png", width: 100, height: 50 },
  tablet: { src: "/logo-tablet.png", width: 150, height: 75 },
  desktop: { src: "/logo-desktop.png", width: 200, height: 100 },
};

describe("Logo", () => {
  beforeEach(() => {
    mockedUseViewport.mockReset();
  });

  it("renders an image when src is provided", async () => {
    mockedUseViewport.mockReturnValue("desktop");
    const { container } = render(<Logo src="/logo.png" fallbackText="Acme" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();

    expect(img).toHaveAttribute("src", "/logo.png");
    expect(img).toHaveAttribute("alt", "Acme");
  });

  it.each(["mobile", "tablet", "desktop"] as const)(
    "uses the %s source and updates dimensions",
    (viewport) => {
      mockedUseViewport.mockReturnValue(viewport);
      render(<Logo fallbackText="Shop" sources={sources} />);
      const img = screen.getByRole("img");
      const expected = sources[viewport];
      expect(img).toHaveAttribute("src", expected.src);
      expect(img).toHaveAttribute(
        "srcset",
        "/logo-mobile.png 100w, /logo-tablet.png 150w, /logo-desktop.png 200w",
      );
      expect(img).toHaveAttribute("width", expected.width.toString());
      expect(img).toHaveAttribute("height", expected.height.toString());
    },
  );

  it("renders fallback text when no source is available", () => {
    render(<Logo fallbackText="Shop" />);
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });
});
