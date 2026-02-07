import { readFileSync } from "fs";
import path from "path";

describe("next app router templates", () => {
  const base = path.join(
    __dirname,
    "..",
    "next-app-router",
    "templates"
  );

  it("renders page template without use client", () => {
    const tpl = readFileSync(path.join(base, "page.tsx.hbs"), "utf8");
    expect(tpl).toContain("function Page");
    expect(tpl).not.toContain("use client");
  });

  it("renders segment layout with use client", () => {
    const tpl = readFileSync(path.join(base, "segmentLayout.tsx.hbs"), "utf8");
    expect(tpl.startsWith("\"use client\";")).toBe(true);
  });

  it("renders metadata", () => {
    const tpl = readFileSync(path.join(base, "metadata.ts.hbs"), "utf8");
    expect(tpl).toContain("export const metadata");
  });
});
