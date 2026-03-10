import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { readRepo } from "@acme/platform-core/repositories/products.server";

import AdminProductsPage from "./page";

jest.mock("@acme/platform-core/repositories/products.server", () => ({
  readRepo: jest.fn(),
}));

const mockReadRepo = readRepo as jest.MockedFunction<typeof readRepo>;

describe("AdminProductsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state when repo returns no products", async () => {
    mockReadRepo.mockResolvedValue([]);

    const ui = (await AdminProductsPage()) as ReactElement;

    render(ui);

    expect(mockReadRepo).toHaveBeenCalledWith("caryina");
    expect(screen.getByText("No products yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New product" })).toHaveAttribute(
      "href",
      "/admin/products/new",
    );
  });

  it("renders product rows and edit links", async () => {
    mockReadRepo.mockResolvedValue([
      {
        id: "p_1",
        title: { en: "Caryina Mini" },
        sku: "CARY-MINI-001",
        price: 12500,
        status: "active",
      },
      {
        id: "p_2",
        title: { en: "Caryina Tote" },
        sku: "CARY-TOTE-001",
        price: 18900,
        status: "draft",
      },
    ] as never);

    const ui = (await AdminProductsPage()) as ReactElement;

    render(ui);

    expect(screen.getByText("Caryina Mini")).toBeInTheDocument();
    expect(screen.getByText("Caryina Tote")).toBeInTheDocument();
    expect(screen.getByText("€125.00")).toBeInTheDocument();
    expect(screen.getByText("€189.00")).toBeInTheDocument();

    const editLinks = screen.getAllByRole("link", { name: "Edit" });
    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute("href", "/admin/products/p_1");
    expect(editLinks[1]).toHaveAttribute("href", "/admin/products/p_2");
  });
});
