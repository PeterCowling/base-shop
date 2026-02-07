/**
 * Breadcrumb Component Tests
 * BOS-UX-03
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import { Breadcrumb } from "./Breadcrumb";

describe("Breadcrumb", () => {
  it("renders correct number of items", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Cards", href: "/cards" },
      { label: "Card Detail" },
    ];

    render(<Breadcrumb items={items} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Cards")).toBeInTheDocument();
    expect(screen.getByText("Card Detail")).toBeInTheDocument();
  });

  it("last item has aria-current='page'", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Current Page" },
    ];

    render(<Breadcrumb items={items} />);

    const currentItem = screen.getByText("Current Page");
    expect(currentItem).toHaveAttribute("aria-current", "page");
  });

  it("links have correct href attributes", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Cards", href: "/cards" },
      { label: "Current" },
    ];

    render(<Breadcrumb items={items} />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");

    const cardsLink = screen.getByRole("link", { name: "Cards" });
    expect(cardsLink).toHaveAttribute("href", "/cards");
  });

  it("renders breadcrumb navigation with proper ARIA label", () => {
    const items = [{ label: "Home", href: "/" }];

    render(<Breadcrumb items={items} />);

    const nav = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(nav).toBeInTheDocument();
  });

  it("renders items without href as plain text", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Plain Text" },
    ];

    render(<Breadcrumb items={items} />);

    const plainText = screen.getByText("Plain Text");
    expect(plainText.tagName).not.toBe("A");
  });
});
