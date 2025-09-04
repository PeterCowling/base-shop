import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

export async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(file: string, value: any): Promise<void> {
  if (
    value === undefined ||
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new TypeError("Expected value to be a non-null object");
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

