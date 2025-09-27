/* eslint-disable security/detect-non-literal-fs-filename -- ABC-123: Paths derive from controlled DATA_ROOT */
import "server-only";

import { returnLogisticsSchema, type ReturnLogistics } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { resolveDataRoot } from "../dataRoot";

function logisticsPath(): string {
  return path.join(resolveDataRoot(), "..", "return-logistics.json");
}

async function readReturnLogistics(): Promise<ReturnLogistics> {
  const buf = await fs.readFile(logisticsPath(), "utf8");
  const parsed = returnLogisticsSchema.safeParse(JSON.parse(buf));
  if (!parsed.success) {
    throw new Error("Invalid return logistics data"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
  }
  return parsed.data;
}

async function writeReturnLogistics(data: ReturnLogistics): Promise<void> {
  const file = logisticsPath();
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export const jsonReturnLogisticsRepository = {
  readReturnLogistics,
  writeReturnLogistics,
};

export type { ReturnLogistics };
