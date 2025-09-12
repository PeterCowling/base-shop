import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Breadcrumbs from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders items in order with separators and no link for last item", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
      { label: "Product", href: "/product" },
    ];

    render(<Breadcrumbs items={items} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveTextContent("Home/Shop/Product");
    expect(screen.getAllByText("/")).toHaveLength(2);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Home", "Shop"]);
    expect(screen.queryByRole("link", { name: "Product" })).not.toBeInTheDocument();
    expect(screen.getByText("Product").tagName).toBe("SPAN");
  });

  it("supports a last item without href", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Checkout" },
    ];

    render(<Breadcrumbs items={items} />);

    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Home"]);
    expect(screen.getAllByText("/")).toHaveLength(1);
    expect(screen.getByText("Checkout").tagName).toBe("SPAN");
  });
});
