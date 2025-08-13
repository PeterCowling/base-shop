import { render, screen } from "@testing-library/react";
import ProductBundle from "../ProductBundle";

jest.mock("@platform-core/src/contexts/CartContext", () => ({
  useCart: () => [{}, jest.fn()],
}));
jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("ProductBundle", () => {
  it("calculates discounted bundle price", () => {
    render(
      <ProductBundle
        items={[
          { sku: "green-sneaker", quantity: 1 },
          { sku: "sand-sneaker", quantity: 2 },
        ]}
        discountPercent={10}
      />
    );
    expect(screen.getByText(/Eco Runner — Green/)).toBeInTheDocument();
    expect(screen.getByText(/Eco Runner — Sand/)).toBeInTheDocument();
    expect(screen.getByText("$357.00")).toBeInTheDocument();
    expect(screen.getByText("$321.30")).toBeInTheDocument();
  });
});
