/* apps/cms/__tests__/seo-generation.test.ts */
/* eslint-env jest */
import path from "node:path";
import React from "react";
import { DefaultSeo } from "next-seo";
import { render } from "@testing-library/react";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

const saved: any = {
  languages: ["en"],
  seo: {},
  analytics: undefined,
  freezeTranslations: false,
  currency: "EUR",
  taxRegion: "",
  updatedAt: "",
  updatedBy: "",
};
jest.mock("@platform-core/src/repositories/settings.server", () => ({
  getShopSettings: jest.fn().mockImplementation(async () => saved),
  saveShopSettings: jest.fn(async (_shop: string, settings: any) => {
    Object.assign(saved, settings);
  }),
  diffHistory: jest.fn(),
}));
jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: jest.fn(async () => saved),
}));

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: jest.fn().mockResolvedValue({
        output: [
          { content: [{ text: JSON.stringify({ title: "AI title", description: "AI description", alt: "alt" }) }] },
        ],
      }),
    },
    images: {
      generate: jest.fn().mockResolvedValue({
        data: [{ b64_json: Buffer.from("img").toString("base64") }],
      }),
    },
  })),
}));

describe("seo generation", () => {
  afterEach(() => {
    jest.resetModules();
    saved.seo = {};
  });

  it("persists generated metadata and exposes via DefaultSeo", async () => {
    (process.env as Record<string, string>).NEXT_PUBLIC_SHOP_ID = "shop1";
    const { generateSeo } = await import("../src/actions/shops.server.ts");
    const fd = new FormData();
    fd.append("id", "prod1");
    fd.append("locale", "en");
    fd.append("title", "Product");
    fd.append("description", "Great product");
    await generateSeo("shop1", fd);

    const { getSeo } = await import(
      /* @vite-ignore */ path.resolve(
        __dirname,
        "../../../packages/template-app/src/lib/seo.ts",
      ),
    );
    const seo = await getSeo("en" as any);
    expect(saved.seo.en.title).toBe("AI title");
    expect(seo.openGraph?.images?.[0]?.url).toBe("/og/prod1.png");
    render(React.createElement(DefaultSeo, seo));
    expect(seo.openGraph?.images?.[0]?.url).toBe("/og/prod1.png");
  });
});
