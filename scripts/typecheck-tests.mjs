import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scopes = ["packages", "apps", "functions"];
const configs = [];
const filter = process.env.TYPECHECK_FILTER;
const includePackages =
  filter || process.env.TYPECHECK_ALL === "1";

const addConfig = (configPath) => {
  if (filter && !configPath.includes(filter)) {
    return;
  }
  configs.push(configPath);
};

const rootConfig = path.join(root, "tsconfig.test.typecheck.json");
if (existsSync(rootConfig)) {
  addConfig(rootConfig);
}

if (includePackages) {
  for (const scope of scopes) {
    const scopePath = path.join(root, scope);
    if (!existsSync(scopePath)) {
      continue;
    }

    for (const entry of readdirSync(scopePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const basePath = path.join(scopePath, entry.name);
      const typecheckConfig = path.join(
        basePath,
        "tsconfig.test.typecheck.json"
      );
      const testConfig = path.join(basePath, "tsconfig.test.json");

      if (existsSync(typecheckConfig)) {
        addConfig(typecheckConfig);
      } else if (existsSync(testConfig)) {
        addConfig(testConfig);
      }
    }
  }
}

if (configs.length === 0) {
  console.log("No test tsconfig files found.");
  process.exit(0);
}

const failures = [];

for (const configPath of configs) {
  const relPath = path.relative(root, configPath);
  console.log(`\n> tsc -p ${relPath} --noEmit --pretty false`);
  const result = spawnSync(
    "pnpm",
    ["exec", "tsc", "-p", relPath, "--noEmit", "--pretty", "false"],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    failures.push(relPath);
  }
}

if (failures.length) {
  console.error("\nTest typecheck failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nTest typecheck passed.");
