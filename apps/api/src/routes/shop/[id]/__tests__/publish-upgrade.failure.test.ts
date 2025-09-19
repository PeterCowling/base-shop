import type { OnRequestPost } from "./publish-upgrade.test-helpers";
import {
  authorize,
  defaultShopId,
  loadOnRequestPost,
  mockSuccessfulSpawn,
  readFileSync,
  resetTestState,
  root,
  spawn,
  writeFileSync,
} from "./publish-upgrade.test-helpers";

let onRequestPost: OnRequestPost;
const id = defaultShopId;

beforeAll(async () => {
  onRequestPost = await loadOnRequestPost();
});

beforeEach(() => {
  resetTestState();
});

describe("onRequestPost failure scenarios", () => {
  it("returns 500 when build command fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn.mockImplementationOnce(() => ({
      on: (event: string, cb: (code: number) => void) => {
        if (event === "close") cb(1);
      },
    }));

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: `pnpm --filter apps/shop-${id} build failed with status 1`,
    });
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith(
      "pnpm",
      ["--filter", `apps/shop-${id}`, "build"],
      { cwd: root, stdio: "inherit" }
    );
    expect(spawn).not.toHaveBeenCalledWith(
      "pnpm",
      ["--filter", `apps/shop-${id}`, "deploy"],
      { cwd: root, stdio: "inherit" }
    );
  });

  it("returns 500 when deploy command fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    spawn
      .mockImplementationOnce(() => ({
        on: (event: string, cb: (code: number) => void) => {
          if (event === "close") cb(0);
        },
      }))
      .mockImplementationOnce(() => ({
        on: (event: string, cb: (code: number) => void) => {
          if (event === "close") cb(1);
        },
      }));

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({
      error: `pnpm --filter apps/shop-${id} deploy failed with status 1`,
    });
  });

  it("returns 500 when writing shop file fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return JSON.stringify({ componentVersions: {} });
      }
      return "";
    });
    writeFileSync.mockImplementation(() => {
      throw new Error("disk full");
    });
    mockSuccessfulSpawn();

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "disk full" });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 when reading shop file fails", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        throw new Error("cannot read");
      }
      return "";
    });

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "cannot read" });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 when shop file cannot be parsed", async () => {
    const invalid = "not-json";
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return JSON.stringify({ dependencies: { compA: "1.0.0" } });
      }
      if (file.endsWith("shop.json")) {
        return invalid;
      }
      return "";
    });

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ components: ["compA"] }),
      }),
    });

    const body = await res.json();
    let parseMessage = "";
    try {
      JSON.parse(invalid);
    } catch (err) {
      parseMessage = err instanceof Error ? err.message : String(err);
    }

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: parseMessage });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 when package.json cannot be read", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        const err = new Error("missing package.json") as NodeJS.ErrnoException;
        err.code = "ENOENT";
        throw err;
      }
      return "";
    });

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: expect.any(String) });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 when a dependency throws a string", async () => {
    readFileSync.mockImplementation(() => {
      throw "boom";
    });

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "boom" });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors", async () => {
    readFileSync.mockImplementation((file: string) => {
      if (file.endsWith("package.json")) {
        return "not-json";
      }
      return "";
    });

    const token = authorize();
    const res = await onRequestPost({
      params: { id },
      request: new Request("http://example.com", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: expect.any(String) });
  });
});
