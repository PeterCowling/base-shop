/** @jest-environment node */

import fs from "fs";
import path from "path";
import ts from "typescript";
import vm from "vm";

const run = jest.fn((argv = process.argv) => undefined);
jest.mock("../cli", () => ({ run }));

describe("bin", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("calls run with process.argv", () => {
    const argv = ["node", "email", "test"];
    process.argv = argv;

    jest.isolateModules(() => {
      const filePath = path.resolve(__dirname, "../bin.ts");
      const source = fs.readFileSync(filePath, "utf8").replace(/^#!.*\n/, "");
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
        fileName: filePath,
      });
      const customRequire = (id: string) =>
        require(path.resolve(path.dirname(filePath), id));
      const moduleContext = { exports: {} };
      vm.runInNewContext(outputText, {
        require: customRequire,
        module: moduleContext,
        exports: moduleContext.exports,
        __dirname: path.dirname(filePath),
        __filename: filePath,
        process,
      });
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0] ?? process.argv).toBe(argv);
  });
});
