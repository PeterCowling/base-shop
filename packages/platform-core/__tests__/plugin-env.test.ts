import fs from "node:fs";
import path from "node:path";
import { findPluginsDir } from "../src/plugins/env";

describe("findPluginsDir", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns discovered plugins directory", () => {
    const start = "/root/a/b";
    const found = "/root/a/packages/plugins";

    jest
      .spyOn(fs, "existsSync")
      .mockImplementation((p: any) => p === found);

    jest.spyOn(path, "dirname").mockImplementation((p: string) => {
      const map: Record<string, string> = {
        "/root/a/b": "/root/a",
        "/root/a": "/root",
        "/root": "/",
        "/": "/",
      };
      return map[p];
    });

    expect(findPluginsDir(start)).toBe(found);
  });

  it("returns final candidate when directory not found", () => {
    const start = "/root/a/b";

    jest.spyOn(fs, "existsSync").mockReturnValue(false);

    jest.spyOn(path, "dirname").mockImplementation((p: string) => {
      const map: Record<string, string> = {
        "/root/a/b": "/root/a",
        "/root/a": "/root",
        "/root": "/",
        "/": "/",
      };
      return map[p];
    });

    expect(findPluginsDir(start)).toBe("/packages/plugins");
  });
});

