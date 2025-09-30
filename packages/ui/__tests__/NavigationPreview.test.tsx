import { render, screen, within } from "@testing-library/react";
import NavigationPreview from "../src/components/cms/NavigationPreview";

describe("NavigationPreview", () => {
  it("renders nested menu links", () => {
    const items = [
      { id: "home", label: "Home", url: "/home" },
      {
        id: "products",
        label: "Products",
        url: "/products",
        children: [
          { id: "hats", label: "Hats", url: "/products/hats" },
          { id: "shirts", label: "Shirts", url: "/products/shirts" },
        ],
      },
      {
        id: "about",
        label: "About",
        url: "/about",
        children: [{ id: "team", label: "Team", url: "/about/team" }],
      },
      {
        id: "misc",
        label: "",
        url: "",
        children: [{ id: "nameless", label: "", url: "" }],
      },
    ];

    const { container } = render(<NavigationPreview items={items} />);

    const productsLink = screen.getByRole("link", { name: "Products" });
    expect(productsLink).toHaveAttribute("href", "/products");
    const productsItem = productsLink.closest("li")!;
    expect(
      within(productsItem).getByRole("link", { name: "Hats" }),
    ).toHaveAttribute("href", "/products/hats");
    expect(
      within(productsItem).getByRole("link", { name: "Shirts" }),
    ).toHaveAttribute("href", "/products/shirts");

    const aboutLink = screen.getByRole("link", { name: "About" });
    const aboutItem = aboutLink.closest("li")!;
    expect(
      within(aboutItem).getByRole("link", { name: "Team" }),
    ).toHaveAttribute("href", "/about/team");

    const placeholderLink = screen.getAllByRole("link", { name: "Item" })[0];
    expect(placeholderLink).toHaveAttribute("href", "#");
  
    const nav = container.querySelector("nav");
    expect(nav).toHaveClass(
      "bg-surface-2",
      "text-foreground",
      "p-4",
      "rounded",
      "border",
      "border-border-1",
    );
  });
});

