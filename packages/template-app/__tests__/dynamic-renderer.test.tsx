/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";

jest.mock("@platform-core/products/index", () => ({ PRODUCTS: [{ id: "sku1" }] }));

const productGridMock = jest.fn(() => <div data-testid="grid" />);
jest.mock("@platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: (props: any) => productGridMock(props),
}));

describe("DynamicRenderer", () => {
  it("warns on unknown component", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <DynamicRenderer
        components={[{ id: "1", type: "Unknown" } as any]}
        locale="en"
      />,
    );
    expect(warn).toHaveBeenCalledWith("Unknown component type: Unknown");
    warn.mockRestore();
  });

  it("renders product grid with products", () => {
    render(
      <DynamicRenderer
        components={[{ id: "2", type: "ProductGrid" } as any]}
        locale="en"
      />,
    );
    expect(productGridMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skus: [{ id: "sku1" }],
        locale: "en",
      }),
    );
  });
});
