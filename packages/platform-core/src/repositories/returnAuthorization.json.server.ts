/* eslint-disable security/detect-non-literal-fs-filename -- ABC-123: Paths derive from controlled DATA_ROOT */
import "server-only";

import { returnAuthorizationSchema, type ReturnAuthorization } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { resolveDataRoot } from "../dataRoot";
import { z } from "zod";

function raPath(): string {
  return path.join(resolveDataRoot(), "..", "return-authorizations.json");
}

const raListSchema = z.array(returnAuthorizationSchema);

async function readReturnAuthorizations(): Promise<ReturnAuthorization[]> {
  try {
    const buf = await fs.readFile(raPath(), "utf8");
    const parsed = raListSchema.safeParse(JSON.parse(buf));
    if (parsed.success) return parsed.data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  return [];
}

async function writeReturnAuthorizations(
  data: ReturnAuthorization[],
): Promise<void> {
  const file = raPath();
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

async function addReturnAuthorization(
  ra: ReturnAuthorization,
): Promise<void> {
  const list = await readReturnAuthorizations();
  list.push(ra);
  await writeReturnAuthorizations(list);
}

async function getReturnAuthorization(
  raId: string,
): Promise<ReturnAuthorization | undefined> {
  const list = await readReturnAuthorizations();
  return list.find((r) => r.raId === raId);
}

export const jsonReturnAuthorizationRepository = {
  readReturnAuthorizations,
  writeReturnAuthorizations,
  addReturnAuthorization,
  getReturnAuthorization,
};
