import React from "react";
import { render, screen } from "@testing-library/react";

import { getShopById } from "@acme/platform-core/repositories/shop.server";
import { getSanityConfig } from "@acme/platform-core/shops";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("@cms/actions/blog.server", () => ({
  createPost: jest.fn(),
}));

jest.mock("@acme/platform-core/shops", () => ({ getSanityConfig: jest.fn() }));

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn(),
}));

jest.mock("../PostForm.client", () => ({
  __esModule: true,
  default: () => <div data-cy="post-form" />,
}));

const mockGetShop = getShopById as jest.Mock;
const mockGetSanity = getSanityConfig as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

it("shows message when no shop selected", async () => {
  const { default: Page } = await import("./page");
  render(await Page({ searchParams: Promise.resolve({}) }));
  expect(screen.getByText("No shop selected.")).toBeInTheDocument();
});

it("shows connect link when Sanity not configured", async () => {
  mockGetShop.mockResolvedValue({ id: "s1" });
  mockGetSanity.mockReturnValue(null);
  const { default: Page } = await import("./page");
  render(await Page({ searchParams: Promise.resolve({ shopId: "s1" }) }));
  expect(screen.getByText("Sanity is not connected.")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Connect Sanity" })
  ).toHaveAttribute("href", "/cms/blog/sanity/connect?shopId=s1");
});

it("renders form when sanity configured", async () => {
  mockGetShop.mockResolvedValue({ id: "s1" });
  mockGetSanity.mockReturnValue({});
  const { default: Page } = await import("./page");
  render(await Page({ searchParams: Promise.resolve({ shopId: "s1" }) }));
  expect(screen.getByText("New Post")).toBeInTheDocument();
  expect(screen.getByTestId("post-form")).toBeInTheDocument();
});

