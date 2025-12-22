import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

function loadParseArgs() {
  const src = readFileSync(
    join(__dirname, "../../../scripts/src/createShop/parse.ts"),
    "utf8"
  );
  const transpiled = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    process: { version: 'v20.0.0', exit: jest.fn(), cwd: () => '/' },
    console: { error: jest.fn() },
    require: (p: string) => {
      if (p.includes('@acme/platform-core/shops')) {
        return {
          validateShopName: (id: string) => {
            if (id.includes('/')) throw new Error('invalid');
            return id;
          },
        };
      }
      return require(p);
    },
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
  return {
    parseArgs: sandbox.exports.parseArgs as (
      argv: string[]
    ) => {
      shopId: string;
      options: any;
      themeProvided: boolean;
      templateProvided: boolean;
      seed: boolean;
    },
    sandbox,
  };
}

describe("parseArgs", () => {
  it("returns defaults when no options", () => {
    const { parseArgs } = loadParseArgs();
    const { shopId: id, options: opts, seed } = parseArgs(["shop"]);
    expect(id).toBe("shop");
    expect(opts).toEqual({
      type: "sale",
      theme: "base",
      template: "template-app",
      payment: [],
      shipping: [],
      enableSubscriptions: false,
    });
    expect(seed).toBe(false);
  });

  it("parses provided options", () => {
    const { parseArgs } = loadParseArgs();
    const { shopId: id, options: opts, themeProvided } = parseArgs([
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
      payment: [],
      shipping: [],
      enableSubscriptions: false,
    });
  });

  it("parses --seed flag", () => {
    const { parseArgs } = loadParseArgs();
    const { seed } = parseArgs(["s1", "--seed"]);
    expect(seed).toBe(true);
  });

  it("loads options from --config", () => {
    const { parseArgs } = loadParseArgs();
    const cfgPath = join(__dirname, "test-config.json");
    writeFileSync(
      cfgPath,
      JSON.stringify({ theme: "dark", template: "tpl", name: "Shop" })
    );
    const { options: opts, themeProvided, templateProvided } = parseArgs([
      "shop",
      `--config=${cfgPath}`,
    ]);
    expect(themeProvided).toBe(true);
    expect(templateProvided).toBe(true);
    expect(opts.name).toBe("Shop");
    unlinkSync(cfgPath);
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
    join(__dirname, "../../../scripts/src/create-shop.ts"),
    "utf8"
  );
  const cut = src.split("await gatherOptions")[0];
  const transpiled = ts.transpileModule(cut, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const originalRequire = require;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    process: { argv: ["node", "script", ...args], version: 'v20.0.0', exit: jest.fn(), cwd: () => '/' },
    console: { error: jest.fn() },
    require: (p: string) => {
      if (p === "./createShop/parse") {
        const ps = readFileSync(
          join(__dirname, "../../../scripts/src/createShop/parse.ts"),
          "utf8"
        );
        const pt = ts.transpileModule(ps, {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText;
        const modSandbox: any = {
          exports: {},
          module: { exports: {} },
          console: sandbox.console,
          process: sandbox.process,
          require: sandbox.require,
        };
        modSandbox.exports = modSandbox.module.exports;
        runInNewContext(pt, modSandbox);
        return modSandbox.module.exports;
      }
      if (p === "./createShop/prompts") {
        return { gatherOptions: jest.fn().mockResolvedValue(undefined) };
      }
      if (p === "./createShop/write") {
        return { writeShop: jest.fn().mockResolvedValue(undefined) };
      }
      if (p === "./runtime") {
        return { ensureRuntime: jest.fn() };
      }
      if (p.includes("@acme/platform-core/createShop")) {
        if (p.endsWith("listProviders")) {
          return {
            listProviders: jest.fn((kind: string) =>
              Promise.resolve(
                kind === "payment"
                  ? [
                      { id: "stripe", name: "stripe", envVars: [] },
                      { id: "paypal", name: "paypal", envVars: [] },
                    ]
                  : [
                      { id: "dhl", name: "dhl", envVars: [] },
                      { id: "ups", name: "ups", envVars: [] },
                    ]
              )
            ),
          };
        }
        return {
          createShop: jest.fn(),
          ensureTemplateExists: (theme: string) => {
            if (theme === "missing") throw new Error("missing");
          },
        };
      }
      if (p.includes("@acme/platform-core/shops")) {
        return {
          validateShopName: (id: string) => {
            if (id.includes('/')) throw new Error('invalid');
            return id;
          },
        };
      }
      return originalRequire(p);
    },
  };
  sandbox.exports = sandbox.module.exports;
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
