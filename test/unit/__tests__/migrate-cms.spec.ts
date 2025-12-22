import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { runInNewContext } from "vm";

jest.mock("cross-fetch", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("node:fs/promises", () => ({ readFile: jest.fn() }));

function runMigrateCms() {
  const baseDir = join(__dirname, "../../../scripts/src");
  const src = readFileSync(
    join(baseDir, "migrate-cms.ts"),
    "utf8"
  );
  const transpiled = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandboxRequire = (mod: string) => {
    if (mod.startsWith("./")) {
      if (mod === "./types/env") {
        return {
          CliEnvSchema: {
            parse: (env: NodeJS.ProcessEnv) => ({
              CMS_SPACE_URL: env.CMS_SPACE_URL,
              CMS_ACCESS_TOKEN: env.CMS_ACCESS_TOKEN,
            }),
          },
        };
      }
      return require(join(baseDir, mod));
    }
    return require(mod);
  };
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    require: sandboxRequire,
    console,
    process,
    __dirname: baseDir,
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
}

describe("scripts/migrate-cms", () => {
  beforeEach(() => {
    jest.resetModules();
    process.exit = jest.fn() as any;
    const fetchMock = require("cross-fetch").default as jest.Mock;
    const { readFile } = require("node:fs/promises");
    fetchMock.mockReset();
    readFile.mockReset();
  });

  it("pushes schemas with correct request", async () => {
    const fetchMock = require("cross-fetch").default as jest.Mock;
    const { readFile } = require("node:fs/promises");
    process.env.STRIPE_SECRET_KEY = "sk";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
    process.env.CMS_SPACE_URL = "https://cms.example.com";
    process.env.CMS_ACCESS_TOKEN = "token";

    readFile
      .mockResolvedValueOnce('{"page":1}')
      .mockResolvedValueOnce('{"shop":1}');
    fetchMock.mockResolvedValue({ ok: true, text: jest.fn(), status: 200 });

    runMigrateCms();
    await new Promise(process.nextTick);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example.com/schemas/page",
      expect.objectContaining({
        method: "PUT",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: '{"page":1}',
      })
    );
  });
});
