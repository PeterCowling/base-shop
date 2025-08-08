import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";
const atomRegistry = { Text: {}, Image: {} };

function loadReducer() {
    const src = readFileSync(
      join(__dirname, "../src/components/cms/PageBuilder.tsx"),
      "utf8"
    );
  const cut = src.split("const palette")[0];
    const transpiled = ts.transpileModule(cut, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
      },
    }).outputText;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
      require: (mod: string) => {
        if (mod.startsWith("./blocks")) return {};
        try {
          return require(mod);
        } catch {
          return {};
        }
      },
  };
  runInNewContext(transpiled, sandbox);
  return sandbox.reducer as (state: any, action: any) => any;
}

describe("PageBuilder reducer", () => {
  const reducer = loadReducer();
  const a = { id: "a", type: "Text" } as any;
  const b = { id: "b", type: "Image" } as any;
  const init = { past: [], present: [] as any[], future: [] };

  it("adds components", () => {
    const state = reducer(init, { type: "add", component: a });
    expect(state.present).toEqual([a]);
    expect(state.past).toEqual([[]]);
  });

  it("moves components", () => {
    const state = reducer(
      { ...init, present: [a, b] },
      { type: "move", from: 0, to: 1 }
    );
    expect(state.present).toEqual([b, a]);
  });

    it("removes component", () => {
      const state = reducer(
        { ...init, present: [a, b] },
        { type: "remove", id: "a" }
      );
      expect(state.present).toEqual([b]);
    });

    it("updates component", () => {
      const state = reducer(
        { ...init, present: [a] },
        { type: "update", id: "a", patch: { foo: "bar" } }
      );
      expect(state.present[0].foo).toBe("bar");
    });

    it("resizes component", () => {
      const state = reducer(
        { ...init, present: [a] },
        {
          type: "resize",
          id: "a",
          width: 100,
          height: 200,
          left: 10,
          top: 20,
        }
      );
      expect(state.present[0]).toMatchObject({
        width: 100,
        height: 200,
        left: 10,
        top: 20,
      });
    });

    it("ignores invalid action type", () => {
      const state = reducer(init, { type: "bogus" } as any);
      expect(state).toBe(init);
    });

    it("undo and redo", () => {
      const added = reducer(init, { type: "add", component: a });
      const undone = reducer(added, { type: "undo" });
      expect(undone.present).toEqual([]);
    const redone = reducer(undone, { type: "redo" });
    expect(redone.present).toEqual([a]);
  });
});

describe("atomRegistry", () => {
  it("contains Text and Image atoms", () => {
    expect(atomRegistry).toHaveProperty("Text");
    expect(atomRegistry).toHaveProperty("Image");
  });
});
