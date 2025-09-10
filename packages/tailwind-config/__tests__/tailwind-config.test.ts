import path from "node:path";

import { execSync } from "node:child_process";

describe("tailwind.config", () => {
  const inspectConfig = () =>
    JSON.parse(
      execSync(
        "node -e \"import('../tailwind.config.mjs').then(async m => {const forms=(await import('@tailwindcss/forms')).default; const cq=(await import('@tailwindcss/container-queries')).default; const cfg=m.default; const hasForms=cfg.plugins.includes(forms); const hasCq=cfg.plugins.includes(cq); console.log(JSON.stringify({hasForms,hasCq,content:cfg.content}));})\"",
        { cwd: __dirname, encoding: "utf8" }
      )
    );

  it("includes expected plugins", () => {
    const { hasForms, hasCq } = inspectConfig();
    expect(hasForms).toBe(true);
    expect(hasCq).toBe(true);
  });

  it("resolves content paths to workspace", () => {
    const { content } = inspectConfig();
    const rootDir = path.resolve(__dirname, "..", "..", "..");
    const expected = [
      path.join(rootDir, "apps/**/*.{ts,tsx,mdx}"),
      path.join(
        rootDir,
        "packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}"
      ),
      path.join(rootDir, ".storybook/**/*.{ts,tsx,mdx}")
    ];
    expect(content).toEqual(expect.arrayContaining(expected));
  });
});
