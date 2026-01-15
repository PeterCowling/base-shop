import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import {
  AggregatedOrder,
  CategoryType,
  Product,
} from "../../../../types/bar/BarTypes";
import OrderTakingScreen from "../OrderTakingScreen";

const categories: CategoryType[] = ["Coffee", "Tea"];
const products: Product[] = [
  { name: "Americano", price: 2, bgColor: "bg-red" },
];
const baseProps = {
  categories,
  selectedCategory: "Coffee" as CategoryType,
  onSelectCategory: vi.fn(),
  products,
  onAddProduct: vi.fn(),
  orders: [] as AggregatedOrder[],
  onRemoveItem: vi.fn(),
  onClearAll: vi.fn(),
  onConfirmPayment: vi.fn(),
  bleepNumber: "",
  onBleepNumberChange: vi.fn(),
  totalPrice: 0,
};

describe("OrderTakingScreen", () => {
  it("renders categories and products", () => {
    render(<OrderTakingScreen {...baseProps} />);
    expect(screen.getByRole("tab", { name: /coffee/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /americano/i })
    ).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <OrderTakingScreen {...baseProps}>
        <div data-testid="child" />
      </OrderTakingScreen>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
