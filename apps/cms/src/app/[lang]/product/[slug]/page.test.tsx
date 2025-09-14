import React from "react";
import { LOCALES } from "@acme/i18n";

jest.mock("@platform-core/products", () => ({ getProductBySlug: jest.fn() }));
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("./PdpClient.client", () => ({ __esModule: true, default: jest.fn(() => null) }));

describe("ProductDetailPage", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("generateStaticParams returns all locale/slug pairs", async () => {
    const { generateStaticParams } = await import("./page");
    const params = await generateStaticParams();
    const expectedSlugs = ["green-sneaker", "sand-sneaker", "black-sneaker"];
    const expected = LOCALES.flatMap((lang) =>
      expectedSlugs.map((slug) => ({ lang, slug }))
    );
    expect(params).toEqual(expected);
  });

  it("generateMetadata returns product title when found", async () => {
    const products = require("@platform-core/products");
    products.getProductBySlug.mockReturnValue({ title: "Demo" });
    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "en", slug: "demo" }),
    });
    expect(products.getProductBySlug).toHaveBeenCalledWith("demo");
    expect(metadata).toEqual({ title: "Demo · Base‑Shop" });
  });

  it("generateMetadata returns fallback title when product missing", async () => {
    const products = require("@platform-core/products");
    products.getProductBySlug.mockReturnValue(undefined);
    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "en", slug: "missing" }),
    });
    expect(metadata).toEqual({ title: "Product not found" });
  });

  it("invokes notFound when product is missing", async () => {
    const products = require("@platform-core/products");
    products.getProductBySlug.mockReturnValue(undefined);
    const { default: ProductDetailPage } = await import("./page");
    const nav = require("next/navigation");
    await ProductDetailPage({
      params: Promise.resolve({ lang: "en", slug: "missing" }),
    });
    expect(nav.notFound).toHaveBeenCalled();
  });

  it("returns PdpClient element when product exists", async () => {
    const product = { title: "Demo", description: "", media: [], sizes: [], price: 0 } as any;
    const products = require("@platform-core/products");
    products.getProductBySlug.mockReturnValue(product);
    const { default: ProductDetailPage } = await import("./page");
    const PdpClient = require("./PdpClient.client").default as React.FC<any>;
    const nav = require("next/navigation");
    const result = await ProductDetailPage({
      params: Promise.resolve({ lang: "en", slug: "demo" }),
    });
    expect(result).toEqual(<PdpClient product={product} />);
    expect(nav.notFound).not.toHaveBeenCalled();
  });
});

