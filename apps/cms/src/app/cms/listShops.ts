import fs from "node:fs/promises";
import path from "node:path";

export async function listShops(): Promise<string[]> {
  try {
    const shopsDir = path.resolve(process.cwd(), "data", "shops");
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
