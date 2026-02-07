import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import DataIndex from "../src/app/cms/shop/[shop]/data/page";

jest.mock("@acme/design-system/atoms", () => ({
  __esModule: true,
  Tag: ({ children, ...props }: { children?: ReactNode }) => (
    <span {...props}>{children}</span>
  ),
}));

describe("DataIndex page", () => {
  it("renders hero and shop-specific cards", async () => {
    const page = await DataIndex({
      params: Promise.resolve({ shop: "acme" }),
    });

    render(page);

    expect(screen.getByText("Data operations · acme")).toBeInTheDocument();

    const cardHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(cardHeadings).toHaveLength(3);

    const expectedCtas = [
      { text: "Manage inventory", href: "/cms/shop/acme/data/inventory" },
      { text: "Configure pricing", href: "/cms/shop/acme/data/rental/pricing" },
      { text: "Optimize returns", href: "/cms/shop/acme/data/return-logistics" },
    ];

    for (const { text, href } of expectedCtas) {
      const link = screen.getByRole("link", { name: text });
      expect(link).toHaveAttribute("href", href);
    }
  });
});
