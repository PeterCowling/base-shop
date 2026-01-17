import { jest } from "@jest/globals";

const prismaMock = {
  shop: { create: jest.fn(async () => ({})) },
  page: { createMany: jest.fn(async () => ({})) },
};

jest.mock("@acme/platform-core/db", () => ({ prisma: prismaMock }));
jest.mock("@acme/platform-core/createShop/themeUtils", () => ({ loadTokens: () => ({}) }));

let wizardStateSchema: any;
let submitShop: any;

beforeAll(async () => {
  ({ wizardStateSchema } = await import("../src/app/cms/wizard/schema"));
  ({ submitShop } = await import("../src/app/cms/wizard/services/submitShop"));
});

describe("navigation round-trip", () => {
  beforeEach(() => {
    prismaMock.shop.create.mockClear();
    prismaMock.page.createMany.mockClear();
  });

  it("persists nested navigation", async () => {
    const state = wizardStateSchema.parse({
      theme: "base",
      navItems: [
        {
          id: "1",
          label: "Parent",
          url: "https://example.com/parent",
          children: [
            {
              id: "2",
              label: "Child",
              url: "https://example.com/parent/child",
            },
          ],
        },
      ],
    });

    const fetchMock = jest.fn(async (input: RequestInfo, init?: RequestInit) => {
      if (typeof input === "string" && input === "/cms/api/configurator") {
        const body = JSON.parse(init!.body as string) as any;
        const { createShop } = await import("@acme/platform-core/createShop");
        const { id, ...opts } = body;
        await createShop(id, opts, { deploy: false });
        return new Response(JSON.stringify({ success: true }), { status: 201 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const originalFetch = global.fetch;
    (global as any).fetch = fetchMock as any;

    const result = await submitShop("shop1", state);
    expect(result.ok).toBe(true);

    expect(prismaMock.shop.create).toHaveBeenCalledTimes(1);
    const nav = prismaMock.shop.create.mock.calls[0][0].data.data.navigation;
    expect(nav).toEqual([
      {
        label: "Parent",
        url: "https://example.com/parent",
        children: [
          { label: "Child", url: "https://example.com/parent/child" },
        ],
      },
    ]);

    (global as any).fetch = originalFetch;
  });
});
