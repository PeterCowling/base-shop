import { render, screen } from "@testing-library/react";
import FooterBlock from "../src/components/cms/blocks/FooterBlock";

describe("FooterBlock", () => {
  it("renders links and logo when provided", () => {
    render(
      <FooterBlock
        locale={"en" as any}
        logo="Brand"
        links={[{ label: "About", href: "/about" }]}
      />,
    );
    expect(screen.getByText("Brand")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "About" });
    expect(link).toHaveAttribute("href", "/about");
  });

  it("renders without links when none provided", () => {
    const { container } = render(
      <FooterBlock locale={"en" as any} links={[]} />,
    );
    expect(container.querySelector("a")).toBeNull();
  });
});
