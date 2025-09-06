import { cpSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface Stats {
  files: number;
  bytes: number;
}

function collectStats(dir: string): Stats {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const s = collectStats(full);
      files += s.files;
      bytes += s.bytes;
    } else if (entry.isFile()) {
      files++;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

export function backupDataRoot(
  root = process.env.DATA_ROOT || join(process.cwd(), "data", "shops"),
): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const dest = `${root}.backup-${stamp}`;
  cpSync(root, dest, { recursive: true });
  const orig = collectStats(root);
  const copy = collectStats(dest);
  if (orig.files !== copy.files || orig.bytes !== copy.bytes) {
    throw new Error("Backup verification failed");
  }
  return dest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const dest = backupDataRoot();
    console.log(`Backup created at ${dest}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
