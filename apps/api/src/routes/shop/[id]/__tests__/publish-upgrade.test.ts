import { jest } from "@jest/globals";
import path from "path";
import jwt from "jsonwebtoken";

const readFileSync = jest.fn();
const writeFileSync = jest.fn();
jest.mock("fs", () => ({ readFileSync, writeFileSync }));

const spawn = jest.fn(() => ({
  on: (_event: string, cb: (code: number) => void) => cb(0),
}));
jest.mock("child_process", () => ({ spawn }));

let onRequestPost: typeof import("../publish-upgrade").onRequestPost;

beforeAll(async () => {
  ({ onRequestPost } = await import("../publish-upgrade"));
});

describe("onRequestPost", () => {
  const id = "abc123";
  const root = path.resolve(__dirname, "..", "../../../../../..");
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "secret";
  });

  it("rejects invalid shop id", async () => {
    const res = await onRequestPost({
      params: { id: "INVALID!" },
      request: new Request("http://example.com", { method: "POST" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects missing token", async () => {
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", { method: "POST" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects invalid token", async () => {
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: "Bearer bad" },
      }),
    });
    expect(res.status).toBe(403);
  });

  it("writes shop.json and runs build/deploy", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0", compB: "2.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });

    const token = jwt.sign({}, "secret");
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    expect(res.status).toBe(200);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const [shopPath, data] = writeFileSync.mock.calls[0];
    expect(shopPath).toContain(`data/shops/${id}/shop.json`);
    const written = JSON.parse(data as string);
    expect(written.componentVersions).toEqual({ compA: "1.0.0" });
    expect(typeof written.lastUpgrade).toBe("string");
    expect(spawn).toHaveBeenNthCalledWith(1, "pnpm", ["--filter", `apps/shop-${id}`, "build"], { cwd: root, stdio: "inherit" });
    expect(spawn).toHaveBeenNthCalledWith(2, "pnpm", ["--filter", `apps/shop-${id}`, "deploy"], { cwd: root, stdio: "inherit" });
  });
});

