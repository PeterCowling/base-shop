import { render, screen } from "@testing-library/react";
import React from "react";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

afterEach(() => {
  jest.clearAllMocks();
});

it("links back to /cms when no shop segment exists", async () => {
  (usePathname as jest.Mock).mockReturnValue("/cms/unknown");
  const { default: CmsNotFound } = await import("./not-found.client");
  render(<CmsNotFound />);
  expect(screen.getByText("404 – Page not found")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: /Back to dashboard/i });
  expect(link).toHaveAttribute("href", "/cms");
});

it("links back to the shop dashboard when shop segment is present", async () => {
  (usePathname as jest.Mock).mockReturnValue("/cms/shop/test/anything");
  const { default: CmsNotFound } = await import("./not-found.client");
  render(<CmsNotFound />);
  const link = screen.getByRole("link", { name: /Back to dashboard/i });
  expect(link).toHaveAttribute("href", "/cms/shop/test");
});
