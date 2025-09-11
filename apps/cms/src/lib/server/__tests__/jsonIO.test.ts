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
  it("returns parsed JSON when file is readable", async () => {
    const data = { value: 3 };
    mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(data));

    const result = await readJsonFile("exists.json", { value: 0 });

    expect(result).toEqual(data);
  });

  it("returns fallback when file is missing", async () => {
    const fallback = { value: 1 };
    mockedFs.readFile.mockRejectedValueOnce(new Error("missing"));

    const result = await readJsonFile("missing.json", fallback);

    expect(result).toBe(fallback);
  });

  it("returns fallback when fs.readFile throws", async () => {
    const fallback = { value: 9 };
    mockedFs.readFile.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const result = await readJsonFile("throws.json", fallback);

    expect(result).toBe(fallback);
  });

  it("returns fallback when fs.readFile returns invalid JSON", async () => {
    const fallback = { value: 2 };
    mockedFs.readFile.mockResolvedValueOnce("not json");

    const result = await readJsonFile("bad.json", fallback);

    expect(result).toBe(fallback);
  });
});

describe("writeJsonFile", () => {
  it("throws TypeError when value is null", async () => {
    await expect(writeJsonFile("file.json", null as any)).rejects.toBeInstanceOf(TypeError);
  });

  it("throws TypeError when value is primitive", async () => {
    await expect(writeJsonFile("file.json", 42 as any)).rejects.toBeInstanceOf(TypeError);
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

  it("writes directly when fs.rename is undefined", async () => {
    const originalRename = mockedFs.rename;
    mockedFs.rename = undefined as any;
    mockedFs.mkdir.mockResolvedValueOnce(undefined);
    mockedFs.writeFile.mockResolvedValueOnce(undefined);

    const data = { b: 2 };
    await writeJsonFile("direct.json", data);

    expect(mockedFs.writeFile).toHaveBeenCalledWith("direct.json", JSON.stringify(data, null, 2), "utf8");
    mockedFs.rename = originalRename;
  });

  it("respects custom indent argument", async () => {
    mockedFs.mkdir.mockResolvedValueOnce(undefined);
    mockedFs.writeFile.mockResolvedValueOnce(undefined);
    mockedFs.rename.mockResolvedValueOnce(undefined);

    const data = { c: 3 };
    await writeJsonFile("indent.json", data, 4);

    const [[tmpPath, json]] = mockedFs.writeFile.mock.calls;
    expect(json).toBe(JSON.stringify(data, null, 4));
    expect(mockedFs.rename).toHaveBeenCalledWith(tmpPath, "indent.json");
  });

  it("rejects when writeFile fails", async () => {
    mockedFs.mkdir.mockResolvedValueOnce(undefined);
    const err = new Error("write fail");
    mockedFs.writeFile.mockRejectedValueOnce(err);

    await expect(writeJsonFile("fail.json", { d: 4 })).rejects.toBe(err);
    expect(mockedFs.writeFile).toHaveBeenCalledTimes(1);
    expect(mockedFs.rename).not.toHaveBeenCalled();
  });

  it("rejects when rename fails", async () => {
    mockedFs.mkdir.mockResolvedValueOnce(undefined);
    mockedFs.writeFile.mockResolvedValueOnce(undefined);
    const err = new Error("rename fail");
    mockedFs.rename.mockRejectedValueOnce(err);

    await expect(writeJsonFile("rename.json", { e: 5 })).rejects.toBe(err);
    expect(mockedFs.writeFile).toHaveBeenCalledTimes(1);
    expect(mockedFs.rename).toHaveBeenCalledTimes(1);
  });
});

describe("withFileLock", () => {
  it("runs callbacks sequentially", async () => {
    const order: string[] = [];
    let releaseFirst!: () => void;

    const first = withFileLock("file", async () => {
      order.push("first-start");
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      order.push("first-end");
    });

    const secondStart = jest.fn(async () => {
      order.push("second-start");
      order.push("second-end");
    });

    const second = withFileLock("file", secondStart);

    await Promise.resolve();
    expect(secondStart).not.toHaveBeenCalled();

    releaseFirst();
    await Promise.all([first, second]);

    expect(order).toEqual(["first-start", "first-end", "second-start", "second-end"]);
  });

  it("starts the second task only after the first resolves", async () => {
    let firstEnd = 0;
    let secondStart = 0;

    const first = withFileLock("same-file", async () => {
      await new Promise((r) => setTimeout(r, 20));
      firstEnd = Date.now();
    });

    const secondFn = jest.fn(async () => {
      secondStart = Date.now();
    });

    const second = withFileLock("same-file", secondFn);

    await Promise.all([first, second]);

    expect(secondFn).toHaveBeenCalledTimes(1);
    expect(secondStart).toBeGreaterThanOrEqual(firstEnd);
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
