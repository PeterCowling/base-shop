
// Mock getServerSession, fs.promises, and resolveDataRoot

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

jest.mock("@platform-core/dataRoot", () => ({
  resolveDataRoot: jest.fn(() => "/data-root"),
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
import path from "path";

const buildRequest = (body: unknown) =>
  new Request("http://localhost/cms/api/configurator/init-shop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("init-shop route", () => {
  it("returns 403 for non-admin session", async () => {
    const { getServerSession } = require("next-auth");
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "user" } });
    const { POST } = await import("./route");
    const res = await POST(new Request("http://localhost"));
    expect(res.status).toBe(403);
  });

  it("writes products.csv and categories.json on success", async () => {
    const { getServerSession } = require("next-auth");
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "admin" } });
    const csvContent = "sku,price\n1,10\n";
    const csv = Buffer.from(csvContent).toString("base64");
    const categories = ["a", "b"];
    const { POST } = await import("./route");
    const res = await POST(buildRequest({ id: "shop1", csv, categories }));

    expect(res.status).toBe(200);
    await res.json(); // ensure body consumed
    expect(mkdirMock).toHaveBeenCalledWith(path.join("/data-root", "shop1"), { recursive: true });
    expect(writeFileMock).toHaveBeenNthCalledWith(1, path.join("/data-root", "shop1", "products.csv"), Buffer.from(csvContent));
    expect(writeFileMock).toHaveBeenNthCalledWith(2, path.join("/data-root", "shop1", "categories.json"), JSON.stringify(categories, null, 2), "utf8");
  });

  it("returns 400 for invalid base64 csv", async () => {
    const { getServerSession } = require("next-auth");
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "admin" } });
    const { POST } = await import("./route");
    const res = await POST(buildRequest({ id: "shop1", csv: "!!!notbase64!!!" }));
    expect(res.status).toBe(400);
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("returns 400 for schema violations", async () => {
    const { getServerSession } = require("next-auth");
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: "admin" } });
    const { POST } = await import("./route");
    const res = await POST(buildRequest({ csv: "" }));
    expect(res.status).toBe(400);
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});

