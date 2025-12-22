import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

const cp = require("node:child_process");
const fs = require("node:fs");
const spawnMock = jest.fn();
fs.existsSync = jest.fn(() => true);

function runDiffShadcn() {
  const src = fs.readFileSync(
    join(__dirname, "../../../scripts/src/diff-shadcn.ts"),
    "utf8"
  );
  const transpiled = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    require,
    console,
    __dirname: join(__dirname, "../../../scripts/src"),
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
}

describe("scripts/diff-shadcn", () => {
  beforeEach(() => {
    jest.resetModules();
    spawnMock.mockClear();
    cp.spawnSync = spawnMock;
  });

  it("runs diff for each component", async () => {
    runDiffShadcn();

    const calls = spawnMock.mock.calls;
    const components = [
      "button",
      "input",
      "card",
      "checkbox",
      "dialog",
      "select",
      "table",
      "textarea",
    ];
    expect(calls).toHaveLength(components.length);
    for (const call of calls) {
      const [cmd, args, opts] = call;
      expect(cmd).toBe("diff");
      expect(args[0]).toBe("-u");
      expect(args[1]).toContain(
        join("node_modules", "@shadcn", "ui", "components")
      );
      expect(args[2]).toContain(join("packages", "ui", "components", "ui"));
      expect(opts).toMatchObject({ stdio: "inherit" });
    }
  });
});
