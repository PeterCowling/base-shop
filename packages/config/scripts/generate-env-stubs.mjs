// packages/config/scripts/generate-env-stubs.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envDir = fileURLToPath(new URL("../src/env", import.meta.url));

function listTsFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => e.name);
}

for (const tsFile of listTsFiles(envDir)) {
  const base = tsFile.replace(/\.ts$/, "");
  const jsPath = path.join(envDir, `${base}.js`);
  const rel = `./${base}.ts`;
  const content = `// packages/config/src/env/${base}.js\nexport * from "${rel}";\n`;
  fs.writeFileSync(jsPath, content, "utf8");
  console.log(`✓ wrote ${base}.js`);
}
