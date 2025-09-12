import { render, screen } from "@testing-library/react";
import { Footer, type FooterLink } from "./Footer";

describe("Footer layout", () => {
  it("renders logo and navigation links", () => {
    const links: FooterLink[] = [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ];
    const logoVariants = {
      desktop: { src: "/logo-desktop.png", width: 100, height: 40 },
    };

    render(<Footer shopName="My Shop" links={links} logoVariants={logoVariants} />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("flex h-14 items-center justify-between border-t px-4");

    const logo = screen.getByAltText("My Shop");
    expect(logo).toBeInTheDocument();

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("ml-auto flex gap-4 text-sm");

    links.forEach((link) => {
      const anchor = screen.getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
      expect(anchor).toHaveClass("hover:underline");
    });
  });
});
