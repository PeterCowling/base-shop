import "@testing-library/jest-dom";

import type React from "react";
import { render, screen } from "@testing-library/react";

import ProductEditPage from "../src/app/cms/shop/[shop]/products/[id]/edit/page";

const mockGetProductById = jest.fn();
const mockReadSettings = jest.fn();
jest.mock("@acme/platform-core/repositories/json.server", () => ({
  getProductById: (...args: any[]) => mockGetProductById(...args),
  readSettings: (...args: any[]) => mockReadSettings(...args),
}));

jest.mock("next/dynamic", () => {
  const React = require("react");
  const MockEditor: React.FC = () => <div data-cy="editor" />;
  MockEditor.displayName = "MockEditor";
  return () => MockEditor;
});
const notFound = jest.fn();
jest.mock("next/navigation", () => ({ notFound }));

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
