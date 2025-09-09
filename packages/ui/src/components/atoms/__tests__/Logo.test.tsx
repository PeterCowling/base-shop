import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Logo } from "../Logo";

import useViewport from "../../../hooks/useViewport";
jest.mock("../../../hooks/useViewport");
const mockedUseViewport = useViewport as jest.Mock;

describe("Logo", () => {
  beforeEach(() => {
    mockedUseViewport.mockReset();
  });

  it("renders an image when src is provided", () => {
    mockedUseViewport.mockReturnValue("desktop");
    render(<Logo src="/logo.png" fallbackText="Acme" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/logo.png");
    expect(img).toHaveAttribute("alt", "Acme");
  });

  it("selects the correct source for the current viewport", () => {
    mockedUseViewport.mockReturnValue("mobile");
    render(
      <Logo
        fallbackText="Shop"
        sources={{
          mobile: { src: "/logo-mobile.png", width: 100, height: 50 },
          desktop: { src: "/logo-desktop.png", width: 200, height: 100 },
        }}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/logo-mobile.png");
    expect(img).toHaveAttribute(
      "srcset",
      "/logo-mobile.png 100w, /logo-desktop.png 200w",
    );
  });

  it("renders fallback text when no source is available", () => {
    render(<Logo fallbackText="Shop" />);
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });
});
