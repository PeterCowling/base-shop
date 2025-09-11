import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import AddToCartButton from "../AddToCartButton.client";

const mockDispatch = jest.fn();

jest.mock("../../../contexts/CartContext", () => ({
  useCart: () => [{}, mockDispatch],
}));

const sku = {
  id: "1",
  slug: "sku",
  title: "Test SKU",
  price: 100,
  deposit: 0,
  stock: 1,
  media: [],
  sizes: [],
  description: "",
  forSale: true,
  forRental: false,
} as any;

afterEach(() => {
  jest.clearAllMocks();
});

describe("AddToCartButton", () => {
  it("does not dispatch when disabled", () => {
    mockDispatch.mockResolvedValueOnce(undefined);
    render(<AddToCartButton sku={sku} disabled />);
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it("dispatches add action and shows spinner until complete", async () => {
    jest.useFakeTimers();
    mockDispatch.mockImplementation(
      () => new Promise<void>((res) => setTimeout(res, 100)),
    );
    render(<AddToCartButton sku={sku} size="M" quantity={2} />);
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "add",
      sku,
      size: "M",
      qty: 2,
    });

    await screen.findByText("Adding...");
    expect(button).toBeDisabled();

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.queryByText("Adding...")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("renders error message when dispatch fails", async () => {
    mockDispatch.mockRejectedValueOnce(new Error("Out of stock"));
    render(<AddToCartButton sku={sku} />);
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Out of stock");
  });

  it("shows error and skips dispatch when quantity is below minimum", async () => {
    render(<AddToCartButton sku={sku} quantity={0} />);
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Quantity must be at least 1",
    );
  });
});

