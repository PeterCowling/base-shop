import { filterProducts, type Product } from "../index";

describe("filterProducts", () => {
  const products: Product[] = [
    {
      id: "p1",
      price: 100,
      availability: [{ from: "2023-01-01", to: "2023-12-31" }],
      tags: ["eco", "sale"],
    },
    {
      id: "p2",
      price: 50,
      availability: [{ from: "2024-01-01", to: "2024-12-31" }],
      tags: ["clearance"],
    },
    {
      id: "p3",
      price: 150,
      tags: ["eco"],
    },
  ];

  it("filters by availability", () => {
    const date = new Date("2023-06-01");
    const result = filterProducts(products, { availableOn: date });
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
    // product outside availability window should be excluded
    expect(result.some((p) => p.id === "p2")).toBe(false);
  });

  it("filters by price range", () => {
    const within = filterProducts(products, { minPrice: 60, maxPrice: 120 });
    expect(within.map((p) => p.id)).toEqual(["p1"]);

    const none = filterProducts(products, { minPrice: 160 });
    expect(none).toEqual([]);
  });

  it("filters by tags", () => {
    const eco = filterProducts(products, { tags: ["eco"] });
    expect(eco.map((p) => p.id)).toEqual(["p1", "p3"]);

    const ecoSale = filterProducts(products, { tags: ["eco", "sale"] });
    expect(ecoSale.map((p) => p.id)).toEqual(["p1"]);
  });

  it("handles empty product arrays", () => {
    expect(filterProducts([], { tags: ["eco"] })).toEqual([]);
  });

  it("returns all products when filters undefined", () => {
    expect(filterProducts(products)).toEqual(products);
  });
});
