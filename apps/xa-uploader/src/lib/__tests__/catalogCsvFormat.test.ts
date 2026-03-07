import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "@jest/globals";

import { readCsvFile, writeCsvFileAtomically } from "@acme/lib/xa";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "xa-uploader-csv-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("catalog CSV format", () => {
  it("writes CRLF line endings and remains readable", async () => {
    const dir = await makeTempDir();
    const csvPath = path.join(dir, "products.xa-b.csv");

    await writeCsvFileAtomically(
      csvPath,
      ["id", "title"],
      [{ id: "p1", title: "Studio jacket" }],
    );

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test temp path
    const raw = await fs.readFile(csvPath, "utf8");
    expect(raw.startsWith("id,title\r\n")).toBe(true);
    expect(raw).toContain("p1,Studio jacket\r\n");
    expect(raw.endsWith("\r\n")).toBe(true);

    const parsed = await readCsvFile(csvPath);
    expect(parsed.header).toEqual(["id", "title"]);
    expect(parsed.rows).toEqual([{ id: "p1", title: "Studio jacket" }]);
  });
});
