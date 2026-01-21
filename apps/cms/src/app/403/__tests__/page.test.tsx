import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { render, screen } from "@testing-library/react";

import AccessDenied from "../page";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const mockSearch = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe("AccessDenied page", () => {
  afterEach(() => jest.resetAllMocks());

  it("links to shop products when shop param provided", () => {
    mockSearch.mockReturnValue(
      new URLSearchParams("shop=my-shop") as unknown as ReadonlyURLSearchParams
    );

    render(<AccessDenied />);
    const link = screen.getByRole("link", { name: /Back to catalogue/i });
    expect(link).toHaveAttribute("href", "/cms/shop/my-shop/products");
  });

  it("defaults link to /products when no shop param", () => {
    mockSearch.mockReturnValue(
      new URLSearchParams() as unknown as ReadonlyURLSearchParams
    );

    render(<AccessDenied />);
    const link = screen.getByRole("link", { name: /Back to catalogue/i });
    expect(link).toHaveAttribute("href", "/products");
  });
});

