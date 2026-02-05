import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");

function findLayoutChunkPath() {
  const preferredDir = path.join(appRoot, ".next", "static", "chunks", "app", "[lang]");
  if (fs.existsSync(preferredDir)) {
    const candidates = fs
      .readdirSync(preferredDir)
      .filter((name) => name.startsWith("layout-") && name.endsWith(".js"))
      .map((name) => path.join(preferredDir, name));
    if (candidates.length > 0) {
      candidates.sort();
      return candidates[0];
    }
  }

  const chunksRoot = path.join(appRoot, ".next", "static", "chunks", "app");
  if (!fs.existsSync(chunksRoot)) return null;

  const stack = [chunksRoot];
  while (stack.length) {
    const dir = stack.pop();
    if (!dir) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (entry.isFile() && entry.name.startsWith("layout-") && entry.name.endsWith(".js")) {
        return full;
      }
    }
  }

  return null;
}

const layoutPath = findLayoutChunkPath();
if (!layoutPath) {
  console.error("perf:check-layout-chunk: could not find .next layout.js chunk");
  process.exit(2);
}

const buf = fs.readFileSync(layoutPath);
const sizeBytes = buf.byteLength;
const maxBytes = 1_000_000;

if (sizeBytes > maxBytes) {
  console.error(
    `perf:check-layout-chunk: layout chunk too large: ${sizeBytes} bytes (max ${maxBytes}) at ${layoutPath}`,
  );
  process.exit(1);
}

const text = buf.toString("utf8");
const forbidden = "guides/content/";
if (text.includes(forbidden)) {
  console.error(
    `perf:check-layout-chunk: layout chunk still contains '${forbidden}' (guides content module map likely still reachable) at ${layoutPath}`,
  );
  process.exit(1);
}

console.log(
  `perf:check-layout-chunk: OK (${sizeBytes} bytes) and no '${forbidden}' in ${layoutPath}`,
);
