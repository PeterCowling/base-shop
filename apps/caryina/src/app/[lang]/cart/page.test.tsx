import { fireEvent, render, screen } from "@testing-library/react";

import CartPage from "./page";

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ lang: "en" })),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "Link";
  return MockLink;
});

const { useCart } = jest.requireMock("@acme/platform-core/contexts/CartContext") as {
  useCart: jest.Mock;
};

const mockDispatch = jest.fn().mockResolvedValue(undefined);

const mockSku = {
  id: "sku-1",
  title: "Silver Ring",
  price: 4500,
  stock: 5,
  sizes: [],
  slug: "silver-ring",
  description: "",
  deposit: 0,
  media: [],
  status: "active",
};

describe("CartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-02: shows cart item title and price", () => {
    const mockCart = { "sku-1": { sku: mockSku, qty: 2 } };
    useCart.mockReturnValue([mockCart, mockDispatch]);
    render(<CartPage />);
    expect(screen.getByText("Silver Ring")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("TC-03: decrements quantity when minus is clicked", () => {
    const mockCart = { "sku-1": { sku: mockSku, qty: 2 } };
    useCart.mockReturnValue([mockCart, mockDispatch]);
    render(<CartPage />);
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: "setQty", id: "sku-1", qty: 1 });
  });

  it("TC-03b: removes item when minus clicked at qty 1", () => {
    const singleQtyCart = { "sku-1": { sku: mockSku, qty: 1 } };
    useCart.mockReturnValue([singleQtyCart, mockDispatch]);
    render(<CartPage />);
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: "remove", id: "sku-1" });
  });

  it("TC-04: dispatches remove when Remove button is clicked", () => {
    const mockCart = { "sku-1": { sku: mockSku, qty: 2 } };
    useCart.mockReturnValue([mockCart, mockDispatch]);
    render(<CartPage />);
    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: "remove", id: "sku-1" });
  });

  it("shows empty state when cart has no items", () => {
    useCart.mockReturnValue([{}, mockDispatch]);
    render(<CartPage />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });
});
