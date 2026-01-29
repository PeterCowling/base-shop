/**
 * NavigationHeader Component Tests
 * BOS-UX-04
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import { NavigationHeader } from "./NavigationHeader";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  usePathname: () => "/boards",
}));

const mockBusinesses = [
  { id: "BRIK", name: "Brikette" },
  { id: "CMS", name: "CMS Platform" },
];

describe("NavigationHeader", () => {
  it("renders all navigation links", () => {
    render(
      <NavigationHeader businesses={mockBusinesses} currentBusiness="BRIK" />
    );

    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /boards/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /people/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plans/i })).toBeInTheDocument();
  });

  it("highlights current route", () => {
    render(
      <NavigationHeader businesses={mockBusinesses} currentBusiness="BRIK" />
    );

    const boardsLink = screen.getByRole("link", { name: /boards/i });
    expect(boardsLink).toHaveAttribute("aria-current", "page");
  });

  it("renders business selector", () => {
    render(
      <NavigationHeader businesses={mockBusinesses} currentBusiness="BRIK" />
    );

    // BusinessSelector should show current business name
    expect(screen.getByText("Brikette")).toBeInTheDocument();
  });
});
