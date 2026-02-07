// packages/config/scripts/verify-config-env.mjs
/*
  eslint-disable security/detect-non-literal-fs-filename -- SEC-0001: Operates only on known dist dir under repo root; no untrusted input for fs paths.
*/
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const distEnvDir = path.join(repoRoot, "packages/config/dist/env");

function run(cmd, args, cwd = repoRoot) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd, env: process.env });
  if (r.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function findExtensionlessSpecifiers() {
  const offenders = [];
  const jsFiles = fs.existsSync(distEnvDir)
    ? fs.readdirSync(distEnvDir).filter((f) => f.endsWith(".js"))
    : [];
  for (const f of jsFiles) {
    const full = path.join(distEnvDir, f);
    const src = read(full);
    // Quote-agnostic, safer checks without potentially unsafe nested quantifiers
    const importFromRE = /^\s*import\s+[^;]*?\sfrom\s+(['"])(\.\/[^'\"]+)\1/gm;
    const exportFromRE = /^\s*export\s+\*\s+from\s+(['"])(\.\/[^'\"]+)\1/gm;
    let m;
    while ((m = importFromRE.exec(src))) {
      const spec = m[2];
      if (!spec.endsWith(".js")) offenders.push({ file: f, spec });
    }
    while ((m = exportFromRE.exec(src))) {
      const spec = m[2];
      if (!spec.endsWith(".js")) offenders.push({ file: f, spec });
    }
  }
  return offenders;
}

async function testImport(fileRel) {
  const file = path.join(distEnvDir, fileRel);
  try {
    await import(pathToFileURL(file).href);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && (e.url || e.message || String(e)) };
  }
}

async function main() {
  // 1) Build the package
  run("pnpm", ["--filter", "@acme/config", "build"]);

  // 2) Verify .js on all relative specifiers
  const offenders = findExtensionlessSpecifiers();
  if (offenders.length) {
    console.error("✗ Found extensionless relative specifiers in dist:");
    offenders.forEach((o) => console.error(`  - ${o.file}: ${o.spec}`));
    process.exit(1);
  } else {
    console.info("✓ No extensionless relative specifiers in dist/env/*.js");
  }

  // 3) Evaluate modules (catch top-level side effects)
  const targets = [
    "index.js",
    "auth.js",
    "cms.js",
    "email.js",
    "payments.js",
    "shipping.js",
    "core.js",
  ].filter((f) => fs.existsSync(path.join(distEnvDir, f)));

  let anyFail = false;
  for (const t of targets) {
    const res = await testImport(t);
    if (!res.ok) {
      anyFail = true;
      console.error(`✗ Import failed: ${t}`);
      if (res.error) console.error(`  ${res.error}`);
    } else {
      console.info(`✓ Import OK: ${t}`);
    }
  }
  if (anyFail) process.exit(1);

  console.info("✓ All env modules import cleanly (no import-time side effects)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
