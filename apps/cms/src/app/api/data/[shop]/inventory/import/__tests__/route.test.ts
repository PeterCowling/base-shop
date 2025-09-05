import { inventoryItemSchema } from "@acme/types";

// Polyfill setImmediate used by fast-csv in the test environment
(global as any).setImmediate =
  (global as any).setImmediate ||
  ((fn: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(fn, 0, ...args));

const getServerSession = jest.fn();
jest.mock("next-auth", () => ({ getServerSession }));
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const write = jest.fn();
jest.mock("@platform-core/repositories/inventory.server", () => ({
  inventoryRepository: { write },
}));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

afterEach(() => {
  jest.clearAllMocks();
});

function req(file?: File) {
  return {
    formData: async () => ({ get: () => file }),
  } as any;
}

describe("POST", () => {
  it("returns 403 without session", async () => {
    getServerSession.mockResolvedValueOnce(null);
    const res = await POST(req(), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 403 for non-admin user", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "user" } });
    const res = await POST(req(), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 when no file provided", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const res = await POST(req(), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "No file provided" });
  });

  it("returns 400 when file lacks text method", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const badFile: any = { name: "bad.csv" };
    const res = await POST(req(badFile), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "No file provided" });
  });

  it("imports inventory from JSON", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const items = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ];
    const file = new File([JSON.stringify(items)], "inv.json", {
      type: "application/json",
    });
    const res = await POST(req(file), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, items });
    expect(write).toHaveBeenCalledWith("s1", items);
  });

  it("imports inventory from CSV", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const csv = "sku,productId,variant.color,quantity\nsku1,p1,red,2";
    const file = new File([csv], "inv.csv", { type: "text/csv" });
    const res = await POST(req(file), { params: Promise.resolve({ shop: "s1" }) });
    const expected = [
      {
        sku: "sku1",
        productId: "p1",
        variantAttributes: { color: "red" },
        quantity: 2,
      },
    ];
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, items: expected });
    expect(write).toHaveBeenCalledWith("s1", expected);
  });

  it("returns 400 when CSV contains invalid data", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const csv = "sku,productId,variant.color,quantity\nsku1,p1,red,-1";
    const file = new File([csv], "inv.csv", { type: "text/csv" });
    const res = await POST(req(file), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: expect.stringContaining("quantity must be greater than 0") });
    expect(write).not.toHaveBeenCalled();
  });

  it("returns 400 when validation fails", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const arraySpy = jest.spyOn(inventoryItemSchema, "array");
    const safeParse = jest.fn().mockReturnValue({
      success: false,
      error: { issues: [{ message: "bad1" }, { message: "bad2" }] },
    });
    arraySpy.mockReturnValue({ safeParse } as any);

    const file = new File(
      [
        JSON.stringify([
          { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
        ]),
      ],
      "inv.json",
      { type: "application/json" },
    );
    const res = await POST(req(file), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "bad1, bad2" });
    expect(write).not.toHaveBeenCalled();
    arraySpy.mockRestore();
  });

  it("returns 400 for JSON object payload", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const item = { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} };
    const file = new File([JSON.stringify(item)], "inv.json", {
      type: "application/json",
    });
    const res = await POST(req(file), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });

  it("returns 400 when write fails", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    write.mockRejectedValueOnce(new Error("boom"));
    const items = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ];
    const file = new File([JSON.stringify(items)], "inv.json", {
      type: "application/json",
    });
    const res = await POST(req(file), { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "boom" });
  });
});
