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
    default: ({ href, children }: any) =>
      React.createElement("a", { href }, children),
  };
});

describe("Orders pages", () => {
  afterEach(() => jest.resetAllMocks());

  it("lists shops on index page", async () => {
    listShops.mockResolvedValue(["shop-a", "shop-b"]);
    const Page = (await import("../src/app/cms/orders/page")).default;
    render(await Page());
    expect(screen.getByRole("link", { name: "shop-a" })).toHaveAttribute(
      "href",
      "/cms/orders/shop-a",
    );
    expect(screen.getByRole("link", { name: "shop-b" })).toHaveAttribute(
      "href",
      "/cms/orders/shop-b",
    );
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
    expect(item).toHaveClass("border-red-500");
    expect(item).toHaveClass("bg-red-50");

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
