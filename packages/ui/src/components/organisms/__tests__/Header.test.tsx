import React from "react";
import { render, screen } from "@testing-library/react";

import { Header } from "../Header";

jest.mock("../../../hooks/useViewport", () => jest.fn(() => "desktop"));

// Capture props passed to Logo to validate responsive variant selection
const logoSpy = jest.fn();
jest.mock("../../atoms", () => ({
  Logo: (props: any) => {
    logoSpy(props);
    return <img alt={props.alt ?? props.fallbackText} />;
  },
}));

jest.mock("../../molecules", () => ({
  LanguageSwitcher: () => <div data-testid="lang" />,
  SearchBar: (p: any) => <input aria-label={p.label} />,
}));

describe("Organisms/Header", () => {
  beforeEach(() => {
    logoSpy.mockClear();
  });

  it("renders submenu items when provided", () => {
    render(
      <Header
        nav={[
          { title: "Shop", href: "/shop", items: [
            { title: "Shoes", href: "/shop/shoes" },
            { title: "Hats", href: "/shop/hats" },
          ] },
        ]}
        locale="en"
        shopName="ACME"
      />,
    );
    expect(screen.getByText("Shop")).toBeInTheDocument();
    // Submenu container is rendered for items (visibility is CSS-only)
    expect(screen.getByText("Shoes")).toBeInTheDocument();
    expect(screen.getByText("Hats")).toBeInTheDocument();
  });

  it("respects showSearch toggle", () => {
    const { rerender } = render(
      <Header nav={[]} locale="en" shopName="ACME" showSearch={true} />,
    );
    expect(screen.getByRole("textbox", { name: /search products/i })).toBeInTheDocument();
    rerender(<Header nav={[]} locale="en" shopName="ACME" showSearch={false} />);
    expect(screen.queryByRole("textbox", { name: /search products/i })).toBeNull();
  });

  it("selects logo variant based on viewport", async () => {
    const useViewport = (await import("../../../hooks/useViewport")).default as jest.Mock;
    const variants = {
      desktop: { src: "/d.png", width: 200, height: 60 },
      tablet: { src: "/t.png", width: 120, height: 40 },
      mobile: { src: "/m.png", width: 80, height: 30 },
    } as const;

    useViewport.mockReturnValue("desktop");
    render(
      <Header nav={[]} locale="en" shopName="ACME" logoVariants={variants} />,
    );
    expect(logoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ src: "/d.png", width: 200, height: 60 })
    );

    logoSpy.mockClear();
    useViewport.mockReturnValue("tablet");
    render(
      <Header nav={[]} locale="en" shopName="ACME" logoVariants={variants} />,
    );
    expect(logoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ src: "/t.png", width: 120, height: 40 })
    );

    logoSpy.mockClear();
    useViewport.mockReturnValue("mobile");
    render(
      <Header nav={[]} locale="en" shopName="ACME" logoVariants={variants} />,
    );
    expect(logoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ src: "/m.png", width: 80, height: 30 })
    );
  });
});
