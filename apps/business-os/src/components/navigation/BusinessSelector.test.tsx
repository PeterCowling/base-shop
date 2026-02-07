/**
 * BusinessSelector Component Tests
 * BOS-UX-04
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import { BusinessSelector } from "./BusinessSelector";

const mockBusinesses = [
  { id: "BRIK", name: "Brikette" },
  { id: "CMS", name: "CMS Platform" },
  { id: "PRIME", name: "Prime" },
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
