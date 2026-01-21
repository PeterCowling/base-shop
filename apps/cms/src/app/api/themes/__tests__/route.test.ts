import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { writeJsonFile } from "@/lib/server/jsonIO";

import { GET, POST } from "../route";

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

// Use the schema from the types package to avoid ESM parsing issues
jest.mock("@acme/theme", () => require("@acme/types/theme/ThemeLibrary"));

describe("themes API route", () => {
  const LIB_PATH = path.join(process.cwd(), "data", "themes", "library.json");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET returns parsed library array", async () => {
    const themes = [
      {
        id: "1",
        name: "Theme1",
        brandColor: "#111",
        createdBy: "user1",
        version: 1,
        themeDefaults: {},
        themeOverrides: {},
        themeTokens: {},
      },
    ];
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(themes));

    const res = await GET();
    expect(await res.json()).toEqual(themes);
    expect(fs.readFile).toHaveBeenCalledWith(LIB_PATH, "utf8");
  });

  it("POST with valid body appends entry and returns 201", async () => {
    const existing = [
      {
        id: "existing",
        name: "Existing",
        brandColor: "#000000",
        createdBy: "Bob",
        version: 1,
        themeDefaults: {},
        themeOverrides: {},
        themeTokens: {},
      },
    ];
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

    const body = {
      id: "new",
      name: "New Theme",
      brandColor: "#ffffff",
      createdBy: "Alice",
    };
    const parsed = {
      ...body,
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    };

    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(parsed);
    expect(writeJsonFile).toHaveBeenCalledWith(LIB_PATH, [...existing, parsed]);
  });

  it("POST with invalid schema returns 400 and error message", async () => {
    const req = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ id: "bad", brandColor: "#fff", createdBy: "Alice" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("name");
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(writeJsonFile).not.toHaveBeenCalled();
  });
});

