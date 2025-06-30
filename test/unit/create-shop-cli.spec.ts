import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

function loadParseArgs() {
  const src = readFileSync(
    join(__dirname, "../../scripts/create-shop.ts"),
    "utf8"
  );
  const cut = src.split("const [shopId")[0];
  const transpiled = ts.transpileModule(cut, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    process: { exit: jest.fn() },
    console: { error: jest.fn() },
    require,
  };
  runInNewContext(transpiled, sandbox);
  return {
    parseArgs: sandbox.parseArgs as (argv: string[]) => [string, any, boolean],
    sandbox,
  };
}

describe("parseArgs", () => {
  it("returns defaults when no options", () => {
    const { parseArgs } = loadParseArgs();
    const [id, opts] = parseArgs(["shop"]);
    expect(id).toBe("shop");
    expect(opts).toEqual({
      type: "sale",
      theme: "base",
      template: "template-app",
      payment: [],
      shipping: [],
    });
  });

  it("parses provided options", () => {
    const { parseArgs } = loadParseArgs();
    const [id, opts, themeProvided] = parseArgs([
      "s1",
      "--type=rental",
      "--theme=dark",
      "--template=tpl",
      "--payment=p1,p2",
      "--shipping=s1",
    ]);
    expect(id).toBe("s1");
    expect(themeProvided).toBe(true);
    expect(opts).toEqual({
      type: "rental",
      theme: "dark",
      template: "tpl",
      payment: ["p1", "p2"],
      shipping: ["s1"],
    });
  });

  it("exits on unknown option", () => {
    const { parseArgs, sandbox } = loadParseArgs();
    parseArgs(["s", "--unknown"]);
    expect(sandbox.console.error).toHaveBeenCalled();
    expect(sandbox.process.exit).toHaveBeenCalled();
  });

  it("exits on invalid type", () => {
    const { parseArgs, sandbox } = loadParseArgs();
    parseArgs(["s", "--type=foo"]);
    expect(sandbox.process.exit).toHaveBeenCalled();
  });
});
