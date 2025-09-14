import { render, screen } from "@testing-library/react";
import React from "react";
import { listShops } from "../../../lib/listShops";

jest.mock("../../../lib/listShops", () => ({ listShops: jest.fn() }));

const mockList = listShops as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

it("renders shop links", async () => {
  mockList.mockResolvedValue(["one", "two"]);
  const { default: Page } = await import("./page");
  render(await Page());
  expect(screen.getByText("Choose a shop")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "one" });
  expect(link).toHaveAttribute("href", "/cms/dashboard/one");
  expect(screen.getByRole("link", { name: "two" })).toBeInTheDocument();
});

it("shows message when no shops", async () => {
  mockList.mockResolvedValue([]);
  const { default: Page } = await import("./page");
  render(await Page());
  expect(screen.getByText("No shops found.")).toBeInTheDocument();
});

