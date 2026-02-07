import { promises as fs } from "fs";
import * as path from "path";

import type { ReturnAuthorization } from "@acme/types";

import {
  addReturnAuthorization,
  getReturnAuthorization,
  readReturnAuthorizations,
  writeReturnAuthorizations,
} from "../src/repositories/returnAuthorization.server";

const DATA_ROOT = path.join("/tmp", "ra-tests");

jest.mock("../src/dataRoot", () => ({
  resolveDataRoot: () => path.join(DATA_ROOT, "data"),
}));

const files = new Map<string, string>();

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(async (p: string) => {
      const data = files.get(p);
      if (data === undefined) {
        const err: NodeJS.ErrnoException = new Error("not found");
        err.code = "ENOENT";
        throw err;
      }
      return data;
    }),
    writeFile: jest.fn(async (p: string, data: string) => {
      files.set(p, data);
    }),
    rename: jest.fn(async (tmp: string, dest: string) => {
      const data = files.get(tmp);
      if (data === undefined) throw new Error("missing");
      files.set(dest, data);
      files.delete(tmp);
    }),
    mkdir: jest.fn(async () => {}),
  },
}));

const raFile = path.join(DATA_ROOT, "return-authorizations.json");

describe("returnAuthorization repository", () => {
  const sample: ReturnAuthorization = {
    raId: "RA1",
    orderId: "O1",
    status: "pending",
    inspectionNotes: "",
  };

  beforeEach(() => {
    files.clear();
    jest.clearAllMocks();
  });

  describe("readReturnAuthorizations", () => {
    it("returns parsed list when file exists", async () => {
      files.set(raFile, JSON.stringify([sample]));
      const res = await readReturnAuthorizations();
      expect(res).toEqual([sample]);
    });

    it("returns empty array when file missing", async () => {
      const res = await readReturnAuthorizations();
      expect(res).toEqual([]);
    });

    it("returns empty array when schema invalid", async () => {
      files.set(raFile, JSON.stringify([{ bad: true }]));
      const res = await readReturnAuthorizations();
      expect(res).toEqual([]);
    });

    it("throws for invalid JSON", async () => {
      files.set(raFile, "{not json");
      await expect(readReturnAuthorizations()).rejects.toThrow();
    });
  });

  it("writes authorizations atomically", async () => {
    await writeReturnAuthorizations([sample]);
    const tmpWrite = (fs.writeFile as jest.Mock).mock.calls[0][0];
    expect(tmpWrite).toContain("return-authorizations.json");
    expect(files.has(tmpWrite)).toBe(false);
    expect(files.has(raFile)).toBe(true);
    expect(JSON.parse(files.get(raFile)!)).toEqual([sample]);
  });

  it("adds and retrieves an authorization", async () => {
    await addReturnAuthorization(sample);
    const list = await readReturnAuthorizations();
    expect(list).toEqual([sample]);
    const ra = await getReturnAuthorization("RA1");
    expect(ra).toEqual(sample);
    const missing = await getReturnAuthorization("RA2");
    expect(missing).toBeUndefined();
  });
});

