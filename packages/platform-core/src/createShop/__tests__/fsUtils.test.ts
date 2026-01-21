import fs from "fs";

import { copyTemplate, ensureDir, writeJSON } from "../fsUtils";

jest.mock("fs");

const fsMock = fs as jest.Mocked<typeof fs>;

describe("fsUtils", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("ensureDir", () => {
    it("creates directory when missing", () => {
      fsMock.existsSync.mockReturnValue(false);
      ensureDir("/foo/bar");
      expect(fsMock.mkdirSync).toHaveBeenCalledWith("/foo/bar", { recursive: true });
    });

    it("skips when directory exists", () => {
      fsMock.existsSync.mockReturnValue(true);
      ensureDir("/foo/bar");
      expect(fsMock.mkdirSync).not.toHaveBeenCalled();
    });

    it("propagates mkdir errors", () => {
      fsMock.existsSync.mockReturnValue(false);
      fsMock.mkdirSync.mockImplementation(() => {
        throw new Error("fail");
      });
      expect(() => ensureDir("/foo/bar")).toThrow("fail");
    });
  });

  describe("copyTemplate", () => {
    it("copies recursively and filters node_modules", () => {
      copyTemplate("src", "dest");
      expect(fsMock.cpSync).toHaveBeenCalledWith(
        "src",
        "dest",
        expect.objectContaining({ recursive: true, filter: expect.any(Function) })
      );
      const filter = (fsMock.cpSync.mock.calls[0][2] as any).filter as (s: string) => boolean;
      expect(filter("/a/node_modules/b")).toBe(false);
      expect(filter("/a/src/index.ts")).toBe(true);
    });

    it("propagates copy errors", () => {
      fsMock.cpSync.mockImplementation(() => {
        throw new Error("copy fail");
      });
      expect(() => copyTemplate("src", "dest")).toThrow("copy fail");
    });
  });

  describe("writeJSON", () => {
    it("writes formatted JSON", () => {
      writeJSON("file.json", { a: 1 });
      expect(fsMock.writeFileSync).toHaveBeenCalledWith(
        "file.json",
        JSON.stringify({ a: 1 }, null, 2) + "\n"
      );
    });

    it("propagates write errors", () => {
      fsMock.writeFileSync.mockImplementation(() => {
        throw new Error("write fail");
      });
      expect(() => writeJSON("file.json", { a: 1 })).toThrow("write fail");
    });
  });
});

