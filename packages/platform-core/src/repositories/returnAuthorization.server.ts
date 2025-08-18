import "server-only";

import { returnAuthorizationSchema, type ReturnAuthorization } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveDataRoot } from "../dataRoot.js";
import { z } from "zod";

function raPath(): string {
  return path.join(resolveDataRoot(), "..", "return-authorizations.json");
}

const raListSchema = z.array(returnAuthorizationSchema);

export async function readReturnAuthorizations(): Promise<ReturnAuthorization[]> {
  try {
    const buf = await fs.readFile(raPath(), "utf8");
    const parsed = raListSchema.safeParse(JSON.parse(buf));
    if (parsed.success) return parsed.data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  return [];
}

export async function writeReturnAuthorizations(
  data: ReturnAuthorization[],
): Promise<void> {
  const file = raPath();
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export async function addReturnAuthorization(
  ra: ReturnAuthorization,
): Promise<void> {
  const list = await readReturnAuthorizations();
  list.push(ra);
  await writeReturnAuthorizations(list);
}

export async function getReturnAuthorization(
  raId: string,
): Promise<ReturnAuthorization | undefined> {
  const list = await readReturnAuthorizations();
  return list.find((r) => r.raId === raId);
}
