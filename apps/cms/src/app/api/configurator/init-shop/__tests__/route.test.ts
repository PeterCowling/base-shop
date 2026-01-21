// Mock getServerSession, fs.promises, and resolveDataRoot

import path from "path";

const mkdirMock = jest.fn();
const writeFileMock = jest.fn();
const renameMock = jest.fn();

jest.mock("fs", () => {
  const actual = jest.requireActual("fs") as typeof import("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: mkdirMock,
      writeFile: writeFileMock,
      rename: renameMock,
    },
  };
});

jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: jest.fn(() => "/data-root"),
}));

function setSession(session: any) {
  const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
  __setMockSession(session);
}

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
    setSession({ user: { role: 'user' } });
    const { POST } = await import("../route");
    const res = await POST(new Request("http://localhost"));
    expect(res.status).toBe(403);
  });

  it("writes products.csv and categories.json on success", async () => {
    setSession({ user: { role: 'admin' } });
    const csvContent = "sku,price\n1,10\n";
    const csv = Buffer.from(csvContent).toString("base64");
    const categories = ["a", "b"];
    const { POST } = await import("../route");
    const res = await POST(buildRequest({ id: "shop1", csv, categories }));

    expect(res.status).toBe(200);
    await res.json(); // ensure body consumed
    expect(mkdirMock).toHaveBeenCalledWith(path.join("/data-root", "shop1"), {
      recursive: true,
    });
    expect(writeFileMock).toHaveBeenNthCalledWith(
      1,
      path.join("/data-root", "shop1", "products.csv"),
      Buffer.from(csvContent)
    );
    const tempPath = writeFileMock.mock.calls[1][0] as string;
    expect(tempPath).toMatch(
      /\/data-root\/shop1\/categories\.json\.\d+\.\d+\.tmp$/,
    );
    expect(writeFileMock).toHaveBeenNthCalledWith(
      2,
      tempPath,
      JSON.stringify(categories, null, 2),
      "utf8"
    );
    expect(renameMock).toHaveBeenCalledWith(
      tempPath,
      path.join("/data-root", "shop1", "categories.json"),
    );
  });

  it("returns 400 for invalid base64 csv", async () => {
    setSession({ user: { role: 'admin' } });
    const { POST } = await import("../route");
    const res = await POST(
      buildRequest({ id: "shop1", csv: "!!!notbase64!!!" })
    );
    expect(res.status).toBe(400);
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("returns 400 for schema violations", async () => {
    setSession({ user: { role: 'admin' } });
    const { POST } = await import("../route");
    const res = await POST(buildRequest({ csv: "" }));
    expect(res.status).toBe(400);
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});
