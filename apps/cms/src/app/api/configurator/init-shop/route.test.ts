const mkdirMock = jest.fn();
const writeFileMock = jest.fn();

jest.mock("fs", () => {
  const actual = jest.requireActual("fs") as typeof import("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: mkdirMock,
      writeFile: writeFileMock,
    },
  };
});

process.env.NEXTAUTH_SECRET = "test-secret";

const getServerSession = jest.fn();
jest.mock("next-auth", () => ({ getServerSession }));

const validateShopName = jest.fn((s: string) => s);
jest.mock("@platform-core/shops", () => ({ validateShopName }));

const buildRequest = (body: unknown) =>
  new Request("http://localhost/cms/api/configurator/init-shop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("POST /cms/api/configurator/init-shop", () => {
  it("returns 403 for unauthorized session", async () => {
    getServerSession.mockResolvedValueOnce(null);
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost"));
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid CSV", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const { POST } = await import("./route");
    const res = await POST(buildRequest({ id: "shop1", csv: "notbase64" }));
    expect(res.status).toBe(400);
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("writes csv and categories on success", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    const csvContent = "sku,price\n1,10\n";
    const csv = Buffer.from(csvContent).toString("base64");
    const categories = ["a", "b"];
    const { POST } = await import("./route");
    const res = await POST(buildRequest({ id: "shop1", csv, categories }));
    expect(res.status).toBe(200);
    await res.json();
    expect(mkdirMock).toHaveBeenCalledWith(expect.stringContaining("shop1"), {
      recursive: true,
    });
    expect(writeFileMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("products.csv"),
      Buffer.from(csvContent)
    );
    expect(writeFileMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("categories.json"),
      JSON.stringify(categories, null, 2),
      "utf8"
    );
  });

  it("returns error when write fails", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    writeFileMock.mockRejectedValueOnce(new Error("disk"));
    const { POST } = await import("./route");
    const csv = Buffer.from("sku\n").toString("base64");
    const res = await POST(buildRequest({ id: "shop1", csv }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "disk" });
  });
});

