import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

const mockGetProductById = jest.fn();
const mockReadSettings = jest.fn();
jest.mock("@platform-core/repositories/json.server", () => ({
  getProductById: (...args: any[]) => mockGetProductById(...args),
  readSettings: (...args: any[]) => mockReadSettings(...args),
}));

jest.mock("next/dynamic", () => () => () => <div data-cy="editor" />);
const notFound = jest.fn();
jest.mock("next/navigation", () => ({ notFound }));

import ProductEditPage from "../src/app/cms/shop/[shop]/products/[id]/edit/page";

describe("ProductEditPage", () => {
  it("renders editor when product found", async () => {
    mockGetProductById.mockResolvedValue({ id: "p1" });
    mockReadSettings.mockResolvedValue({ languages: ["en"] });
    const Page = await ProductEditPage({
      params: Promise.resolve({ shop: "s1", id: "p1" }),
    });
    render(Page);
    expect(screen.getByText("Edit product – s1/p1")).toBeInTheDocument();
    expect(screen.getByTestId("editor")).toBeInTheDocument();
  });

  it("calls notFound when product missing", async () => {
    mockGetProductById.mockResolvedValue(null);
    mockReadSettings.mockResolvedValue({ languages: ["en"] });
    await ProductEditPage({ params: Promise.resolve({ shop: "s1", id: "p1" }) });
    expect(notFound).toHaveBeenCalled();
  });
});
