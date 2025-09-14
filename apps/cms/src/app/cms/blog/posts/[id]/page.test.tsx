import { render, screen } from "@testing-library/react";
import React from "react";
import { notFound } from "next/navigation";
import { getPost } from "@cms/actions/blog.server";
import { getSanityConfig } from "@platform-core/shops";
import { getShopById } from "@platform-core/repositories/shop.server";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));

jest.mock("@cms/actions/blog.server", () => ({
  getPost: jest.fn(),
  updatePost: jest.fn(),
}));

jest.mock("@platform-core/shops", () => ({ getSanityConfig: jest.fn() }));

jest.mock("@platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn(),
}));

jest.mock("../PostForm.client", () => ({
  __esModule: true,
  default: () => <div data-cy="post-form" />,
}));

jest.mock("../PublishButton.client", () => ({
  __esModule: true,
  default: () => <button data-cy="publish" />,
}));

jest.mock("../UnpublishButton.client", () => ({
  __esModule: true,
  default: () => <button data-cy="unpublish" />,
}));

jest.mock("../DeleteButton.client", () => ({
  __esModule: true,
  default: () => <button data-cy="delete" />,
}));

jest.mock("@acme/date-utils", () => ({
  formatTimestamp: (ts: string) => `formatted ${ts}`,
}));

const mockNotFound = notFound as unknown as jest.Mock;
const mockGetShop = getShopById as jest.Mock;
const mockGetSanity = getSanityConfig as jest.Mock;
const mockGetPost = getPost as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

it("calls notFound when shopId missing", async () => {
  const { default: Page } = await import("./page");
  await Page({ params: { id: "1" }, searchParams: {} });
  expect(mockNotFound).toHaveBeenCalled();
});

it("shows connect link when Sanity not configured", async () => {
  mockGetShop.mockResolvedValue({ id: "s1" });
  mockGetSanity.mockReturnValue(null);
  const { default: Page } = await import("./page");
  render(
    await Page({ params: { id: "1" }, searchParams: { shopId: "s1" } })
  );
  expect(
    screen.getByText("Sanity is not connected.")
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Connect Sanity" })
  ).toHaveAttribute("href", "/cms/blog/sanity/connect?shopId=s1");
});

it("renders post form when post exists", async () => {
  mockGetShop.mockResolvedValue({ id: "s1" });
  mockGetSanity.mockReturnValue({});
  mockGetPost.mockResolvedValue({
    _id: "p1",
    published: true,
    publishedAt: undefined,
  });
  const { default: Page } = await import("./page");
  render(
    await Page({ params: { id: "p1" }, searchParams: { shopId: "s1" } })
  );
  expect(screen.getByText("Edit Post")).toBeInTheDocument();
  expect(screen.getByTestId("post-form")).toBeInTheDocument();
  expect(screen.getByTestId("unpublish")).toBeInTheDocument();
});

it("calls notFound when post does not exist", async () => {
  mockGetShop.mockResolvedValue({ id: "s1" });
  mockGetSanity.mockReturnValue({});
  mockGetPost.mockResolvedValue(null);
  const { default: Page } = await import("./page");
  await Page({ params: { id: "missing" }, searchParams: { shopId: "s1" } });
  expect(mockNotFound).toHaveBeenCalled();
});

