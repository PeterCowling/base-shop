import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(
  __dirname,
  "..",
  "..",
  "packages",
  "tailwind-config",
  "src",
  "index.ts"
);
const source = readFileSync(configPath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const sandbox = { module: { exports: {} }, exports: {}, require, process, console };
sandbox.exports = sandbox.module.exports;
runInNewContext(transpiled, sandbox, { filename: configPath });
const preset = sandbox.module.exports.default ?? sandbox.module.exports;

console.log(
  `[@acme/tailwind-config] ✅  preset imported (cwd: ${process.cwd()})`
);
console.log(
  "[@acme/tailwind-config] preset keys",
  preset && typeof preset === "object" ? Object.keys(preset) : "not an object"
);
if (preset && typeof preset === "object") {
  console.log(
    "[@acme/tailwind-config] has nested",
    {
      plugins: Boolean(preset.plugins),
      presets: Boolean(preset.presets),
    }
  );
}

const nodeRequire = createRequire(
  typeof __filename !== "undefined" ? __filename : process.cwd() + "/"
);

let resolvedPresetPath;
try {
  resolvedPresetPath = nodeRequire.resolve("@acme/tailwind-config", {
    paths: [path.resolve(__dirname, "..", "..")],
  });
} catch (err) {
  resolvedPresetPath = configPath;
  console.warn(
    "[tailwind.config] ⚠️  fell back to workspace source path",
    String(err)
  );
}

console.log(
  `[tailwind.config] ✅  @acme/tailwind-config resolved → ${resolvedPresetPath}`
);

console.log(
  "[tailwind.config] ℹ️  preset keys:",
  preset && typeof preset === "object" ? Object.keys(preset) : "not an object"
);
