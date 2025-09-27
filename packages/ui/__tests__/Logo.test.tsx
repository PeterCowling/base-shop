import React from "react";
import { render } from "@testing-library/react";
import { Logo } from "../src/components/atoms/Logo";
import useViewport from "../src/hooks/useViewport";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt={props.alt ?? ""} {...props} />,
}));

jest.mock("../src/hooks/useViewport");

const mockViewport = useViewport as jest.Mock;

describe("Logo", () => {
  it("renders fallback text when no image source", () => {
    mockViewport.mockReturnValue("desktop");
    const { getByText } = render(<Logo fallbackText="ACME" />);
    expect(getByText("ACME")).toBeInTheDocument();
  });

  it("selects source by viewport and builds srcSet", () => {
    const sources = {
      desktop: { src: "/desktop.png", width: 200, height: 100 },
      tablet: { src: "/tablet.png", width: 100, height: 50 },
      mobile: { src: "/mobile.png", width: 50, height: 25 },
    } as const;

    mockViewport.mockReturnValue("desktop");
    const { container, rerender } = render(
      <Logo fallbackText="ACME" sources={sources} />
    );
    let img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/desktop.png");

    const srcset = img.getAttribute("srcset")!;
    expect(srcset).toContain("/desktop.png 200w");
    expect(srcset).toContain("/tablet.png 100w");
    expect(srcset).toContain("/mobile.png 50w");

    mockViewport.mockReturnValue("tablet");
    rerender(<Logo fallbackText="ACME" sources={sources} />);
    img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/tablet.png");

    mockViewport.mockReturnValue("mobile");
    rerender(<Logo fallbackText="ACME" sources={sources} />);
    img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/mobile.png");
  });
});
