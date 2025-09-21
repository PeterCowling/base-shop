import "@testing-library/jest-dom";
import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const listShops = jest.fn();
jest.mock("../src/lib/listShops", () => ({ listShops }));

const readOrders = jest.fn();
const markReturned = jest.fn();
const markRefunded = jest.fn();
jest.mock("@platform-core/orders", () => ({
  readOrders,
  markReturned,
  markRefunded,
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

describe("Orders pages", () => {
  afterEach(() => jest.resetAllMocks());

  it("lists shops on index page", async () => {
    const shops = ["shop-a", "shop-b"];
    listShops.mockResolvedValue(shops);
    const Page = (await import("../src/app/cms/orders/page")).default;
    render(await Page());
    const ctas = screen.getAllByTestId("shop-chooser-cta");
    expect(ctas).toHaveLength(shops.length);
    ctas.forEach((cta, index) => {
      expect(cta).toHaveAttribute("data-index", String(index));
      expect(cta).toHaveAttribute("href", `/cms/orders/${shops[index]}`);
      expect(cta).toHaveAccessibleName(shops[index].toUpperCase());
    });
  });

  it("shows order details and calls actions", async () => {
    readOrders.mockResolvedValue([
      {
        id: "o1",
        sessionId: "sess1",
        expectedReturnDate: "2024-01-01",
        riskLevel: "high",
        riskScore: 5,
        flaggedForReview: true,
      },
    ]);
    const Page = (await import("../src/app/cms/orders/[shop]/page")).default;
    render(await Page({ params: { shop: "shop-a" } }));

    expect(screen.getByText("Order: o1")).toBeInTheDocument();
    expect(screen.getByText("Return: 2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("Risk Level: high")).toBeInTheDocument();
    expect(screen.getByText("Risk Score: 5")).toBeInTheDocument();
    expect(
      screen.getByText("Flagged for Review: Yes"),
    ).toBeInTheDocument();
    expect(screen.getByText("Flagged")).toBeInTheDocument();

    const item = screen.getByText("Order: o1").closest("li");
    expect(item).toHaveClass("border-danger");
    expect(item).toHaveClass("bg-danger/10");

    const returnButton = screen.getByRole("button", {
      name: /mark returned/i,
    });
    const returnForm = returnButton.closest("form")!;
    await act(async () => {
      fireEvent.submit(returnForm);
    });
    expect(markReturned).toHaveBeenCalledWith("shop-a", "sess1");

    const refundButton = screen.getByRole("button", { name: /refund/i });
    const refundForm = refundButton.closest("form")!;
    await act(async () => {
      fireEvent.submit(refundForm);
    });
    expect(markRefunded).toHaveBeenCalledWith("shop-a", "sess1");
  });
});
