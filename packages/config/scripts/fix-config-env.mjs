// packages/config/scripts/fix-config-env.mjs
/*
  eslint-disable security/detect-non-literal-fs-filename -- SEC-0001: Paths are constructed from `repoRoot` + static subpaths, no untrusted input; operations stay within the repo tree.
*/
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcEnvDir = path.join(repoRoot, "packages/config/src/env");
const tsconfigPath = path.join(repoRoot, "packages/config/tsconfig.json");

function listTsFiles(dir) {
  const out = [];
  (function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith(".ts")) out.push(p);
    }
  })(dir);
  return out;
}

function ensureTsconfigGuards() {
  if (!fs.existsSync(tsconfigPath)) return;
  const json = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
  json.compilerOptions = json.compilerOptions || {};
  // Keep existing settings; only enforce guards we need
  if (json.compilerOptions.verbatimModuleSyntax !== true) {
    json.compilerOptions.verbatimModuleSyntax = true;
  }
  if (json.compilerOptions.allowJs !== false) {
    json.compilerOptions.allowJs = false;
  }
  fs.writeFileSync(tsconfigPath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.info(
    "✓ tsconfig: set compilerOptions.verbatimModuleSyntax=true, allowJs=false"
  );
}

function pascalCase(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function addJsToSpecifier(spec) {
  // only touch relative paths without extension
  if (!spec.startsWith("./") && !spec.startsWith("../")) return spec;
  if (/\.[a-zA-Z0-9]+$/.test(spec)) return spec; // already has extension
  return `${spec}.js`;
}

function patchRelativeSpecifiers(code) {
  // import ... from './x'
  code = code.replace(
    /(import\s+[^;]*?\sfrom\s+)(['"])(\.{1,2}\/[^'"]+)(\2)/g,
    (_, p1, q, pth, q2) => p1 + q + addJsToSpecifier(pth) + q2
  );
  // export * from './x'
  code = code.replace(
    /(export\s+\*\s+from\s+)(['"])(\.{1,2}\/[^'"]+)(\2)/g,
    (_, p1, q, pth, q2) => p1 + q + addJsToSpecifier(pth) + q2
  );
  return code;
}

function detectSchemaVar(code) {
  // Prefer exported const; fallback to non-export
  let m = code.match(/export\s+const\s+(\w+EnvSchema)\s*=/);
  if (!m) m = code.match(/const\s+(\w+EnvSchema)\s*=/);
  return m ? m[1] : null;
}

function ensureTypeAlias(code, schemaVar, typeName) {
  if (!schemaVar || !typeName) return code;
  const desired = `export type ${typeName} = z.infer<typeof ${schemaVar}>;`;
  // Avoid dynamic RegExp construction for security lint compliance.
  // Replace existing export type line if present, otherwise append.
  if (code.includes(`export type ${typeName} = z.infer`)) {
    const lines = code.split("\n").map((ln) =>
      ln.trimStart().startsWith(`export type ${typeName} = z.infer`)
        ? desired
        : ln,
    );
    code = lines.join("\n");
  } else if (!code.includes(`export type ${typeName}`)) {
    // append near the schema declaration if possible
    const insertAfter = code.indexOf(schemaVar);
    if (insertAfter !== -1) {
      // append at end is simplest/safest
      code = code.trimEnd() + "\n\n" + desired + "\n";
    } else {
      code = code.trimEnd() + "\n\n" + desired + "\n";
    }
  }
  return code;
}

function ensureLoader(code, schemaVar, typeName, loaderName) {
  if (!schemaVar || !typeName || !loaderName) return code;
  // Avoid dynamic RegExp construction; simple substring check is enough here.
  if (code.includes(`export function ${loaderName}`)) {
    return code;
  }
  const fn = [
    ``,
    `export function ${loaderName}(raw: NodeJS.ProcessEnv = process.env): ${typeName} {`,
    `  const parsed = ${schemaVar}.safeParse(raw);`,
    `  if (!parsed.success) {`,
    `    throw new Error('Invalid ${typeName} variables');`,
    `  }`,
    `  return parsed.data;`,
    `}`,
    ``,
  ].join("\n");
  return code.trimEnd() + "\n" + fn;
}

function commentOutTopLevelEnvConst(code) {
  // Find export const SomethingEnv = ... process.env ... ;
  // Be conservative: only if process.env appears within the initializer
  return code.replace(/export\s+const\s+\w+Env\s*=\s*[\s\S]*?;\s*/g, (m) =>
    m.includes("process.env")
      ? `/* Replaced by loader:\n${m.replace(/\*\//g, "*\\/")}*/\n`
      : m
  );
}

function fileBaseNamesToType(filePath) {
  const base = path.basename(filePath, ".ts"); // auth, cms, email, payments, shipping, index, core
  if (base === "index")
    return {
      typeName: "Env",
      loaderName: "loadEnv",
      expectedSchema: "envSchema",
    };
  if (base === "core")
    return {
      typeName: "CoreEnv",
      loaderName: "loadCoreEnv",
      expectedSchema: "coreEnvSchema",
    };
  return {
    typeName: `${pascalCase(base)}Env`,
    loaderName: `load${pascalCase(base)}Env`,
  };
}

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");
  const original = code;

  // 1) Relative specifiers => .js
  code = patchRelativeSpecifiers(code);

  // 2) Remove eager top-level env constants
  code = commentOutTopLevelEnvConst(code);

  // 3) Types + loaders
  const { typeName, loaderName, expectedSchema } =
    fileBaseNamesToType(filePath);
  let schemaVar = detectSchemaVar(code);
  // If file is index/core and expectedSchema exists, prefer it
  if (!schemaVar && expectedSchema && code.includes(expectedSchema)) {
    schemaVar = expectedSchema;
  }

  if (typeName && schemaVar) {
    code = ensureTypeAlias(code, schemaVar, typeName);
    code = ensureLoader(code, schemaVar, typeName, loaderName);
  }

  if (code !== original) {
    fs.writeFileSync(filePath, code, "utf8");
    console.info(`✓ patched ${path.relative(repoRoot, filePath)}`);
  }
}

function run() {
  ensureTsconfigGuards();
  const files = listTsFiles(srcEnvDir);
  for (const f of files) fixFile(f);
  console.info("Done.");
}

run();
