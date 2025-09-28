/** @jest-environment node */

import { NextRequest } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";

function req(body: unknown) {
  return new NextRequest("http://test.local", {
    method: "POST",
    body: JSON.stringify(body),
  } as any);
}

describe("POST", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("generates seo metadata and stores file", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-"));
    jest.doMock("@platform-core/dataRoot", () => ({ DATA_ROOT: dir }));
    const validateShopName = jest.fn((s: string) => s);
    jest.doMock("@acme/lib", () => ({ validateShopName }));
    const result = {
      title: "AI title",
      description: "AI description",
      alt: "alt",
      image: "/og/p1.png",
    };
    const generateMeta = jest.fn().mockResolvedValue(result);
    jest.doMock("@acme/lib/generateMeta", () => ({ generateMeta }));

    const { POST } = await import("../route");
    const res = await POST(
      req({
        shop: "shop1",
        id: "p1",
        title: "Product",
        description: "Desc",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(result);
    const file = path.join(dir, "shop1", "seo.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-2651: test uses controlled temp directory path
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    expect(data).toEqual({ p1: result });
    expect(generateMeta).toHaveBeenCalledWith({
      id: "p1",
      title: "Product",
      description: "Desc",
    });
  });

  it("throws when templates are missing", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-"));
    jest.doMock("@platform-core/dataRoot", () => ({ DATA_ROOT: dir }));
    jest.doMock("@acme/lib", () => ({ validateShopName: (s: string) => s }));
    jest.doMock("@acme/lib/generateMeta", () => ({
      generateMeta: () => {
        throw new Error("missing templates");
      },
    }));

    const { POST } = await import("../route");
    await expect(
      POST(
        req({
          shop: "shop1",
          id: "p1",
          title: "Product",
          description: "Desc",
        }),
      ),
    ).rejects.toThrow("missing templates");
  });
});
