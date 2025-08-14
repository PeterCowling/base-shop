import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

function loadParseArgs() {
  const src = readFileSync(
    join(__dirname, "../../scripts/src/create-shop.ts"),
    "utf8"
  );
  const cut = src.split("const [shopId")[0];
  const transpiled = ts.transpileModule(cut, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    process: { version: 'v20.0.0', exit: jest.fn() },
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
      subscriptions: false,
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
      subscriptions: false,
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

  it("exits on invalid shop name", () => {
    const { parseArgs, sandbox } = loadParseArgs();
    parseArgs(["bad/name"]);
    expect(sandbox.console.error).toHaveBeenCalled();
    expect(sandbox.process.exit).toHaveBeenCalled();
  });
});

function runCli(args: string[]) {
  const src = readFileSync(
    join(__dirname, "../../scripts/src/create-shop.ts"),
    "utf8"
  );
  const cut = src.split("async function ensureTheme")[0];
  const transpiled = ts.transpileModule(cut, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const originalRequire = require;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    process: { argv: ["node", "script", ...args], version: 'v20.0.0', exit: jest.fn() },
    console: { error: jest.fn() },
    require: (p: string) => {
      if (p.includes("packages/platform-core/src/createShop")) {
        if (p.endsWith("listProviders")) {
          return {
            listProviders: jest.fn((kind: string) =>
              Promise.resolve(
                kind === "payment" ? ["stripe", "paypal"] : ["dhl", "ups"]
              )
            ),
          };
        }
        return { createShop: jest.fn() };
      }
      return originalRequire(p);
    },
  };
  runInNewContext(transpiled, sandbox);
  return sandbox;
}

describe("CLI", () => {
  it("exits when theme does not exist", () => {
    const sandbox = runCli(["shop", "--theme=missing"]);
    expect(sandbox.console.error).toHaveBeenCalled();
    expect(sandbox.process.exit).toHaveBeenCalledWith(1);
  });

  it("passes payment providers through for validation", () => {
    const sandbox = runCli(["shop", "--payment=foo"]);
    expect(sandbox.process.exit).not.toHaveBeenCalled();
    expect(sandbox.console.error).not.toHaveBeenCalled();
  });

  it("passes shipping providers through for validation", () => {
    const sandbox = runCli(["shop", "--shipping=bar"]);
    expect(sandbox.process.exit).not.toHaveBeenCalled();
    expect(sandbox.console.error).not.toHaveBeenCalled();
  });

  it("exits when shop name is invalid", () => {
    const sandbox = runCli(["bad/name"]);
    expect(sandbox.console.error).toHaveBeenCalled();
    expect(sandbox.process.exit).toHaveBeenCalledWith(1);
  });
});
