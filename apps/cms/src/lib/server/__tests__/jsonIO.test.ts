// apps/cms/src/lib/server/__tests__/jsonIO.test.ts
/* eslint-env jest */

import { promises as fs } from "fs";
import { readJsonFile, writeJsonFile, withFileLock } from "../jsonIO";

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    rename: jest.fn(),
  },
}));

const mockedFs = fs as unknown as {
  readFile: jest.Mock;
  writeFile: jest.Mock;
  mkdir: jest.Mock;
  rename: jest.Mock;
};

afterEach(() => jest.resetAllMocks());

describe("readJsonFile", () => {
  it("returns fallback when file is missing", async () => {
    const fallback = { value: 1 };
    mockedFs.readFile.mockRejectedValueOnce(new Error("missing"));

    const result = await readJsonFile("missing.json", fallback);

    expect(result).toBe(fallback);
  });

  it("returns fallback when JSON cannot be parsed", async () => {
    const fallback = { value: 2 };
    mockedFs.readFile.mockResolvedValueOnce("not json");

    const result = await readJsonFile("bad.json", fallback);

    expect(result).toBe(fallback);
  });
});

describe("writeJsonFile", () => {
  it("throws TypeError for non-object values", async () => {
    // @ts-expect-error passing string to trigger TypeError
    await expect(writeJsonFile("file.json", "nope")).rejects.toBeInstanceOf(TypeError);
  });

  it("writes JSON with 2-space indent by default", async () => {
    mockedFs.mkdir.mockResolvedValueOnce(undefined);
    mockedFs.writeFile.mockResolvedValueOnce(undefined);
    mockedFs.rename.mockResolvedValueOnce(undefined);

    const data = { a: 1 };
    await writeJsonFile("out.json", data);

    const [[tmpPath, json, encoding]] = mockedFs.writeFile.mock.calls;
    expect(json).toBe(JSON.stringify(data, null, 2));
    expect(encoding).toBe("utf8");
    expect(mockedFs.rename).toHaveBeenCalledWith(tmpPath, "out.json");
  });
});

describe("withFileLock", () => {
  it("serializes calls for the same file", async () => {
    const events: string[] = [];

    const first = withFileLock("file.json", async () => {
      events.push("first start");
      await new Promise((r) => setTimeout(r, 10));
      events.push("first end");
    });

    const second = withFileLock("file.json", async () => {
      events.push("second start");
      events.push("second end");
    });

    await Promise.all([first, second]);

    expect(events).toEqual(["first start", "first end", "second start", "second end"]);
  });

  it("does not block different files", async () => {
    const events: string[] = [];

    const a = withFileLock("a.json", async () => {
      events.push("a start");
      await new Promise((r) => setTimeout(r, 20));
      events.push("a end");
    });

    const b = withFileLock("b.json", async () => {
      events.push("b start");
      await new Promise((r) => setTimeout(r, 10));
      events.push("b end");
    });

    await Promise.all([a, b]);

    expect(events).toEqual(["a start", "b start", "b end", "a end"]);
  });
});
