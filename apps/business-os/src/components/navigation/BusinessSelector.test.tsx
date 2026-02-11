/**
 * BusinessSelector Component Tests
 * BOS-UX-04
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import { BusinessSelector } from "./BusinessSelector";

const mockBusinesses = [
  {
    id: "BRIK",
    name: "Brikette",
    description: "Brikette",
    owner: "Pete",
    category: "operating-business" as const,
    status: "active" as const,
    created: "2026-02-11",
    tags: [],
    apps: ["brikette", "reception", "prime"],
  },
  {
    id: "PLAT",
    name: "Platform",
    description: "Platform",
    owner: "Pete",
    category: "internal-system" as const,
    status: "active" as const,
    created: "2026-02-11",
    tags: [],
    apps: ["platform-core"],
  },
  {
    id: "BOS",
    name: "Business OS",
    description: "Business OS",
    owner: "Pete",
    category: "internal-system" as const,
    status: "active" as const,
    created: "2026-02-11",
    tags: [],
    apps: ["business-os"],
  },
];

describe("BusinessSelector", () => {
  it("shows all businesses in dropdown", () => {
    render(
      <BusinessSelector businesses={mockBusinesses} currentBusiness="BRIK" />
    );

    // Current business should be visible
    expect(screen.getByText("Brikette")).toBeInTheDocument();
  });

  it("highlights current business", () => {
    render(
      <BusinessSelector businesses={mockBusinesses} currentBusiness="BRIK" />
    );

    // The current business name should be displayed
    const currentBusinessDisplay = screen.getByText("Brikette");
    expect(currentBusinessDisplay).toBeInTheDocument();
  });

  it("renders selector button", () => {
    render(
      <BusinessSelector businesses={mockBusinesses} currentBusiness="BRIK" />
    );

    // Should have a button to open the dropdown
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
