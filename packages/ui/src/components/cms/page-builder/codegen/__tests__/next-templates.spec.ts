import { promises as fs } from "node:fs";
import path from "node:path";

type Ctx = { client?: boolean; blocks?: string[]; title?: string };

function render(tpl: string, ctx: Ctx): string {
  let out = tpl;
  out = out.replace("{{#if client}}'use client';\n{{/if}}\n", ctx.client ? "'use client';\n" : "");
  out = out.replace(/{{#each blocks}}\n([\s\S]*?){{\/each}}\n/, ctx.blocks?.join("\n") + "\n" || "");
  if (ctx.title) out = out.replace(/{{title}}/g, ctx.title);
  return out;
}

describe("next app router templates", () => {
  const dir = path.join(
    process.cwd(),
    "packages/ui/src/components/cms/page-builder/codegen/next-app-router/templates",
  );

  it("adds use client for interactive blocks", async () => {
    const tpl = await fs.readFile(path.join(dir, "page.tsx.hbs"), "utf8");
    const out = render(tpl, { client: true, blocks: ["<p />"] });
    expect(out).toContain("'use client'");
  });

  it("omits use client by default", async () => {
    const tpl = await fs.readFile(path.join(dir, "page.tsx.hbs"), "utf8");
    const out = render(tpl, { blocks: ["<p />"] });
    expect(out).not.toContain("'use client'");
  });

  it("renders metadata title", async () => {
    const tpl = await fs.readFile(path.join(dir, "metadata.ts.hbs"), "utf8");
    const out = render(tpl, { title: "Hello" });
    expect(out).toContain("Hello");
  });
});
