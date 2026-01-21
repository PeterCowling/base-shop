import React from "react";
import { render, screen } from "@testing-library/react";

import { listShops } from "../../../lib/listShops";

jest.mock("../../../lib/listShops", () => ({ listShops: jest.fn() }));

const mockList = listShops as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

it("renders shop links", async () => {
  mockList.mockResolvedValue(["one", "two"]);
  const { default: Page } = await import("./page");
  render(await Page({}));
  expect(
    screen.getByRole("heading", { name: "Choose a storefront to inspect" })
  ).toBeInTheDocument();
  const links = screen.getAllByRole("link", { name: "View dashboard" });
  expect(links).toHaveLength(2);
  expect(links[0]).toHaveAttribute("href", "/cms/dashboard/one");
  expect(links[1]).toHaveAttribute("href", "/cms/dashboard/two");
});

it("shows message when no shops", async () => {
  mockList.mockResolvedValue([]);
  const { default: Page } = await import("./page");
  render(await Page({}));
  expect(
    screen.getByText(
      "No shops found. Create a shop in the configurator to unlock dashboards."
    ),
  ).toBeInTheDocument();
});

