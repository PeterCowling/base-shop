import fs from "node:fs";
import path from "node:path";

const RETRIES = 8;
const RETRY_DELAY_MS = 100;
const TARGETS = [
  "dist",
  "tsconfig.tsbuildinfo",
];

for (const target of TARGETS) {
  const fullPath = path.resolve(process.cwd(), target);
  fs.rmSync(fullPath, {
    force: true,
    recursive: true,
    maxRetries: RETRIES,
    retryDelay: RETRY_DELAY_MS,
  });
}
