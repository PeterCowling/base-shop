import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execSync("git ls-files", { encoding: "utf8" })
  .trim()
  .split(/\n+/)
  .filter((f) => !f.includes("node_modules"));

const pattern = /\[\s*['\"]en['\"]\s*,\s*['\"]de['\"]\s*,\s*['\"]it['\"]\s*\]/;
const violations: string[] = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (pattern.test(text)) violations.push(file);
}

if (violations.length) {
  console.error(
    "Hard-coded locale array detected. Authoritative list is LOCALES."
  );
  violations.forEach((f) => console.error(" -", f));
  process.exit(1);
} else {
  console.log("No hard-coded locale arrays found.");
}
