import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const scriptPath = "../scripts/migrate-legacy-strings";

async function runCli(args: string[]) {
  const originalArgv = process.argv.slice();
  const originalCwd = process.cwd();

  const logs: string[] = [];
  const logSpy = jest.spyOn(console, "log").mockImplementation((...msg) => {
    logs.push(msg.join(" "));
  });
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  try {
    process.argv = ["node", "migrate-legacy-strings.ts", ...args];
    process.chdir(path.join(__dirname, ".."));

    jest.resetModules();
    await import(scriptPath);
  } finally {
    process.argv = originalArgv;
    process.chdir(originalCwd);
    logSpy.mockRestore();
    warnSpy.mockRestore();
  }

  return { logs };
}

describe("migrate-legacy-strings CLI", () => {
  it("reports changes in dry-run mode when given a single file", async () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "i18n-migrate-single-")
    );
    const file = path.join(tmpDir, "page.json");

    const original = { title: "Hello", other: "keep" };
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(file, JSON.stringify(original, null, 2), "utf8");

    const { logs } = await runCli(["--path", file, "--dry-run"]);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const after = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    expect(after).toEqual(original);

    expect(logs.some((msg) => msg.includes("files would change"))).toBe(true);
    expect(
      logs.some((msg) =>
        msg.includes("Dry-run only. Re-run with --write to apply.")
      )
    ).toBe(true);
  });

  it("writes migrated JSON when run against a directory", async () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "i18n-migrate-dir-")
    );
    const root = path.join(tmpDir, "pages");
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(root);

    const file = path.join(root, "page.json");
    const original = {
      title: "Title",
      subtitle: "Subtitle",
      notTranslatable: "unchanged",
      nested: {
        desc: "Description",
        alreadyInline: { type: "inline", value: { en: "Keep" } },
        keyRef: { type: "key", key: "cta.shop" },
      },
      list: ["First", { title: "Inner" }],
    };
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(file, JSON.stringify(original, null, 2), "utf8");

    await runCli(["--path", root, "--write"]);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const after = JSON.parse(fs.readFileSync(file, "utf8")) as any;

    expect(after.title).toEqual({
      type: "inline",
      value: { en: "Title" },
    });
    expect(after.subtitle).toEqual({
      type: "inline",
      value: { en: "Subtitle" },
    });

    expect(after.notTranslatable).toBe("unchanged");

    expect(after.nested.desc).toEqual({
      type: "inline",
      value: { en: "Description" },
    });
    expect(after.nested.alreadyInline).toEqual(original.nested.alreadyInline);
    expect(after.nested.keyRef).toEqual(original.nested.keyRef);

    expect(after.list[0]).toBe("First");
    expect(after.list[1].title).toEqual({
      type: "inline",
      value: { en: "Inner" },
    });
  });
});
