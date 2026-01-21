import * as React from "react";
import { describe, expect, it, jest } from "@jest/globals";

import type { XaProduct } from "../../../lib/demoData";

const makeProduct = (overrides: Partial<XaProduct>): XaProduct => {
  const { taxonomy, details, ...rest } = overrides;
  return {
    id: "sku-1",
    slug: "sku-1",
    title: "Test Product",
    price: 150,
    deposit: 0,
    stock: 3,
    forSale: true,
    forRental: false,
    media: [{ url: "https://example.com/img.jpg", type: "image", altText: "Image" }],
    sizes: ["S", "M"],
    description: "desc",
    brand: "acme",
    collection: "core",
    createdAt: "2024-01-01T00:00:00Z",
    popularity: 1,
    taxonomy: {
      department: "women",
      category: "clothing",
      subcategory: "tops",
      color: ["black"],
      material: ["cotton"],
      ...(taxonomy ?? {}),
    },
    details: details ?? {},
    ...rest,
  };
};

async function renderProductPage(product: XaProduct, products: XaProduct[], config: Record<string, unknown>) {
  jest.resetModules();

  const notFoundMock = jest.fn();
  jest.doMock("next/navigation", () => ({
    notFound: () => notFoundMock(),
  }));
  jest.doMock("@acme/ui/atoms/Section", () => {
    const React = require("react");
    return {
      Section: ({ children }: { children: React.ReactNode }) =>
        React.createElement("section", null, children),
    };
  });
  jest.doMock("@acme/ui/atoms/Grid", () => {
    const React = require("react");
    return {
      Grid: ({ children }: { children: React.ReactNode }) =>
        React.createElement("div", null, children),
    };
  });
  jest.doMock("@acme/ui/components/molecules", () => {
    const React = require("react");
    return {
      Breadcrumbs: ({ items }: { items: Array<{ label: string }> }) =>
        React.createElement("nav", null, items.map((item) => item.label).join(" / ")),
    };
  });
  jest.doMock("@acme/ui/components/atoms", () => {
    const React = require("react");
    return {
      Button: ({ children }: { children: React.ReactNode }) =>
        React.createElement("button", null, children),
    };
  });
  jest.doMock("../../../components/XaBuyBox.client", () => ({
    XaBuyBox: () => <div data-testid="buy-box" />,
  }));
  jest.doMock("../../../components/XaImageGallery.client", () => ({
    XaImageGallery: () => <div data-testid="gallery" />,
  }));
  jest.doMock("../../../components/XaProductCard", () => ({
    XaProductCard: () => <div data-testid="product-card" />,
  }));
  jest.doMock("../../../components/XaSizeGuideDialog.client", () => ({
    XaSizeGuideDialog: ({ copy }: { copy: string }) => <div>{copy}</div>,
  }));
  jest.doMock("../../../lib/demoData", () => ({
    getXaProductByHandle: () => product,
    XA_PRODUCTS: products,
    XA_BRANDS: [{ handle: product.brand, name: "Acme" }],
  }));
  jest.doMock("../../../lib/siteConfig", () => ({
    siteConfig: config,
  }));
  jest.doMock("../../../lib/support", () => ({
    toWhatsappHref: (value: string) => (value ? `https://wa.me/${value}` : null),
  }));

  const mod = await import("../[handle]/page");
  const Page = mod.default;
  const result = await Page({ params: Promise.resolve({ handle: product.slug }) });
  return { notFoundMock, result };
}

describe("ProductPage", () => {
  it("renders clothing sections with share and contact links", async () => {
    const product = makeProduct({
      details: {
        modelHeight: "5'9\"",
        modelSize: "S",
        fitNote: "Relaxed fit",
        sizeGuide: "Standard sizing guide",
        fabricFeel: "Soft wool",
        care: "Dry clean only",
      },
    });
    const products = [
      product,
      makeProduct({
        id: "sku-2",
        slug: "sku-2",
        brand: "acme",
        taxonomy: {
          department: "women",
          category: "bags",
          subcategory: "tote",
          color: ["black"],
          material: ["leather"],
        },
      }),
    ];
    const config = {
      brandName: "XA",
      catalog: {
        categories: ["clothing", "bags", "jewelry"],
        departments: ["women", "men"],
        defaultDepartment: "women",
      },
      domain: "example.com",
      supportEmail: "support@example.com",
      instagramUrl: "https://instagram.com/xa",
      whatsappNumber: "1234",
      wechatId: "xa-support",
      businessHours: "9-5",
      showSocialLinks: true,
      showContactInfo: true,
      stealthMode: false,
    };

    const { notFoundMock, result } = await renderProductPage(product, products, config);
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("renders bag details without share section in stealth mode", async () => {
    const product = makeProduct({
      taxonomy: {
        department: "women",
        category: "bags",
        subcategory: "tote",
        color: ["black"],
        material: ["leather"],
      },
      details: {
        dimensions: "30x20",
        strapDrop: "12cm",
        whatFits: ["phone", "wallet"],
        interior: ["pocket"],
      },
    });
    const config = {
      brandName: "XA",
      catalog: {
        categories: ["clothing", "bags", "jewelry"],
        departments: ["women", "men"],
        defaultDepartment: "women",
      },
      domain: "example.com",
      supportEmail: "",
      instagramUrl: "",
      whatsappNumber: "",
      wechatId: "",
      businessHours: "",
      showSocialLinks: false,
      showContactInfo: false,
      stealthMode: true,
    };

    const { result } = await renderProductPage(product, [product], config);
    expect(result).toBeTruthy();
  });

  it("renders jewelry attributes and care", async () => {
    const product = makeProduct({
      taxonomy: {
        department: "women",
        category: "jewelry",
        subcategory: "rings",
        color: ["gold"],
        material: ["gold"],
        metal: "yellow-gold",
        gemstone: "diamond",
        jewelrySize: "7",
      },
      details: {
        care: "Polish gently",
        warranty: "Two years",
      },
    });
    const config = {
      brandName: "XA",
      catalog: {
        categories: ["clothing", "bags", "jewelry"],
        departments: ["women", "men"],
        defaultDepartment: "women",
      },
      domain: "example.com",
      supportEmail: "support@example.com",
      instagramUrl: "",
      whatsappNumber: "",
      wechatId: "",
      businessHours: "",
      showSocialLinks: false,
      showContactInfo: true,
      stealthMode: false,
    };

    const { result } = await renderProductPage(product, [product], config);
    expect(result).toBeTruthy();
  });
});
