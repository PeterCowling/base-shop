import "server-only";

import { returnLogisticsSchema, type ReturnLogistics } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveDataRoot } from "../utils";

function logisticsPath(): string {
  return path.join(resolveDataRoot(), "..", "return-logistics.json");
}

export async function readReturnLogistics(): Promise<ReturnLogistics> {
  const buf = await fs.readFile(logisticsPath(), "utf8");
  const parsed = returnLogisticsSchema.safeParse(JSON.parse(buf));
  if (!parsed.success) {
    throw new Error("Invalid return logistics data");
  }
  return parsed.data;
}

export async function writeReturnLogistics(data: ReturnLogistics): Promise<void> {
  const file = logisticsPath();
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

