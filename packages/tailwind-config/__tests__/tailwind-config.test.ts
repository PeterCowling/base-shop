import path from "node:path";
import { execSync } from "node:child_process";

describe("tailwind config", () => {
  it("includes expected plugins and content paths", async () => {
    const configPath = path.resolve(__dirname, "..", "tailwind.config.mjs");
    const output = execSync(
      `node -e "(async () => { const m = await import('file://${configPath}'); const forms = (await import('@tailwindcss/forms')).default; const cq = (await import('@tailwindcss/container-queries')).default; const hasForms = m.default.plugins.includes(forms); const hasCQ = m.default.plugins.includes(cq); console.log(JSON.stringify({ hasForms, hasCQ, content: m.default.content })) })();"`,
      { encoding: "utf8" }
    );
    const { hasForms, hasCQ, content } = JSON.parse(output);
    expect(hasForms).toBe(true);
    expect(hasCQ).toBe(true);
    const rootDir = path.resolve(__dirname, "..", "..", "..");
    expect(content).toEqual([
      path.join(rootDir, "apps/**/*.{ts,tsx,mdx}"),
      path.join(
        rootDir,
        "packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}"
      ),
      path.join(rootDir, ".storybook/**/*.{ts,tsx,mdx}"),
      "!**/node_modules",
      "!**/dist",
      "!**/.next",
    ]);
  });
});
