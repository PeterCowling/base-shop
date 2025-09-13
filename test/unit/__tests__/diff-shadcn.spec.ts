import { join } from "path";

const cp = require("node:child_process");
const fs = require("node:fs");
const spawnMock = jest.fn();
fs.existsSync = jest.fn(() => true);

describe("scripts/diff-shadcn", () => {
  beforeEach(() => {
    jest.resetModules();
    spawnMock.mockClear();
    cp.spawnSync = spawnMock;
  });

  it("runs diff for each component", async () => {
    await import("../../../scripts/diff-shadcn");

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
