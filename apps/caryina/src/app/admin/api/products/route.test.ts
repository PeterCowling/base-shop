import { POST } from "@/app/admin/api/products/route";

jest.mock("@acme/platform-core/repositories/products.server", () => ({
  readRepo: jest.fn().mockResolvedValue([]),
  writeRepo: jest.fn().mockResolvedValue(undefined),
  getProductById: jest.fn(),
  updateProductInRepo: jest.fn(),
  deleteProductFromRepo: jest.fn(),
}));

const { readRepo, writeRepo } = jest.requireMock(
  "@acme/platform-core/repositories/products.server",
) as {
  readRepo: jest.Mock;
  writeRepo: jest.Mock;
};

const VALID_BODY = {
  sku: "test-charm-silver",
  title: "Test Charm Silver",
  description: "A test charm",
  price: 2500,
  currency: "EUR",
  status: "active",
  media: [{ url: "https://example.com/image.jpg", type: "image" }],
};

describe("POST /admin/api/products", () => {
  beforeEach(() => {
    readRepo.mockResolvedValue([]);
    writeRepo.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: creates a product and returns 201 with the new product", async () => {
    const req = new Request("http://localhost/admin/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; data: { sku: string; id: string } };
    expect(body.ok).toBe(true);
    expect(body.data.sku).toBe("test-charm-silver");
    expect(typeof body.data.id).toBe("string");
    expect(writeRepo).toHaveBeenCalledTimes(1);
  });

  it("TC-06: returns 400 for missing required sku field", async () => {
    const req = new Request("http://localhost/admin/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Title only", price: 1000 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("validation_error");
    expect(writeRepo).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/admin/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("defaults all locales to the English title value", async () => {
    const req = new Request("http://localhost/admin/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    const responseBody = (await res.json()) as {
      data: { title: { en: string; de: string; it: string } };
    };
    expect(responseBody.data.title.en).toBe("Test Charm Silver");
    expect(responseBody.data.title.de).toBe("Test Charm Silver");
    expect(responseBody.data.title.it).toBe("Test Charm Silver");
  });
});
