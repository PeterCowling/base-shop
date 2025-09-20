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

  it("sets adding true during dispatch and false after resolve", async () => {
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

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.queryByText("Adding...")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("sets adding true during dispatch and false after reject", async () => {
    jest.useFakeTimers();
    mockDispatch.mockImplementation(
      () =>
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("Out of stock")), 100),
        ),
    );
    render(<AddToCartButton sku={sku} />);
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);

    await screen.findByText("Adding...");

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.queryByText("Adding...")).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Out of stock");
    jest.useRealTimers();
  });

  it("shows default error when dispatch rejects without a proper Error", async () => {
    mockDispatch.mockRejectedValueOnce("oops");
    render(<AddToCartButton sku={sku} />);
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to add to cart");
  });

  it("clears error and dispatches on retry", async () => {
    mockDispatch.mockRejectedValueOnce(new Error("Out of stock"));
    mockDispatch.mockResolvedValueOnce(undefined);

    render(<AddToCartButton sku={sku} />);
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent("Out of stock");

    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
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
