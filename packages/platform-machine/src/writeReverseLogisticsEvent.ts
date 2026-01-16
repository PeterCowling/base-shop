/* eslint-disable security/detect-non-literal-fs-filename -- PLAT-1234: Paths are derived from internal configuration */
import type { ReverseLogisticsEventName } from "@acme/types";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const DATA_ROOT = resolveDataRoot();

export interface ReverseLogisticsEvent {
  sessionId: string;
  status: ReverseLogisticsEventName;
}

export async function writeReverseLogisticsEvent(
  shop: string,
  sessionId: string,
  status: ReverseLogisticsEvent["status"],
  dataRoot: string = DATA_ROOT
): Promise<void> {
  const dir = join(dataRoot, shop, "reverse-logistics");
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${randomUUID()}.json`);
  await writeFile(file, JSON.stringify({ sessionId, status }));
}
