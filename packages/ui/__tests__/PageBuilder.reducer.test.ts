import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

function loadReducer() {
  const src = readFileSync(
    join(__dirname, "../components/cms/PageBuilder.tsx"),
    "utf8"
  );
  const cut = src.split("const palette")[0];
  const transpiled = ts.transpileModule(cut, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: any = { exports: {}, module: { exports: {} }, require };
  runInNewContext(transpiled, sandbox);
  return sandbox.reducer as (state: any[], action: any) => any[];
}

describe("PageBuilder reducer", () => {
  const reducer = loadReducer();
  const a = { id: "a", type: "Text" } as any;
  const b = { id: "b", type: "Image" } as any;

  it("adds components", () => {
    expect(reducer([], { type: "add", component: a })).toEqual([a]);
  });

  it("moves components", () => {
    const state = [a, b];
    expect(reducer(state, { type: "move", from: 0, to: 1 })).toEqual([b, a]);
  });

  it("removes component", () => {
    const state = [a, b];
    expect(reducer(state, { type: "remove", id: "a" })).toEqual([b]);
  });

  it("updates component", () => {
    const state = [a];
    expect(
      reducer(state, { type: "update", id: "a", patch: { foo: "bar" } })[0].foo
    ).toBe("bar");
  });
});
