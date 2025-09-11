import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { writeJsonFile } from "@/lib/server/jsonIO";

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

jest.mock("@/lib/server/jsonIO", () => ({
  writeJsonFile: jest.fn(),
}));

jest.mock(
  "@acme/theme",
  () => require("@acme/types/theme/ThemeLibrary"),
  { virtual: true },
);

import { GET, PATCH, DELETE } from "../route";

describe("theme by id API route", () => {
  const LIB_PATH = path.join(process.cwd(), "data", "themes", "library.json");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET returns 404 when theme missing", async () => {
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error("no file"));
    const res = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ themeId: "t1" }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
    expect(fs.readFile).toHaveBeenCalledWith(LIB_PATH, "utf8");
  });

  it("PATCH returns 400 on validation error", async () => {
    const existing = [{
      id: "t1",
      name: "Theme1",
      brandColor: "#000",
      createdBy: "Bob",
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    }];
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));
    const req = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ themeOverrides: "invalid" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ themeId: "t1" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(writeJsonFile).not.toHaveBeenCalled();
  });

  it("PATCH returns 404 for unknown theme", async () => {
    const existing = [{
      id: "other",
      name: "Other",
      brandColor: "#000",
      createdBy: "Bob",
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    }];
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));
    const req = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "New" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ themeId: "t1" }) });
    expect(res.status).toBe(404);
    expect(writeJsonFile).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when write fails", async () => {
    const existing = [{
      id: "t1",
      name: "Theme1",
      brandColor: "#000",
      createdBy: "Bob",
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    }];
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));
    (writeJsonFile as jest.Mock).mockRejectedValueOnce(new Error("write"));
    const req = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "New" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ themeId: "t1" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "write" });
  });

  it("DELETE removes theme", async () => {
    const existing = [{
      id: "t1",
      name: "Theme1",
      brandColor: "#000",
      createdBy: "Bob",
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    }, {
      id: "t2",
      name: "Theme2",
      brandColor: "#111",
      createdBy: "Alice",
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    }];
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));
    const res = await DELETE(new NextRequest("http://localhost"), {
      params: Promise.resolve({ themeId: "t1" }),
    });
    expect(res.status).toBe(204);
    expect(writeJsonFile).toHaveBeenCalledWith(LIB_PATH, [existing[1]]);
  });

  it("DELETE returns 404 when theme missing", async () => {
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));
    const res = await DELETE(new NextRequest("http://localhost"), {
      params: Promise.resolve({ themeId: "t1" }),
    });
    expect(res.status).toBe(404);
    expect(writeJsonFile).not.toHaveBeenCalled();
  });
});
