import type { ReturnLogistics } from "@acme/types";
import { returnLogisticsSchema } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";

let cached: ReturnLogistics | null = null;

export async function getReturnLogistics(): Promise<ReturnLogistics> {
  if (cached) return cached;
  const base = path.resolve(resolveDataRoot(), "..");
  const file = path.resolve(base, "return-logistics.json");
  if (!file.startsWith(base + path.sep)) {
    throw new Error("Resolved path escapes base directory"); // i18n-exempt -- CORE-1010 internal error message
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized against base
  const buf = await fs.readFile(file, "utf8");
  cached = returnLogisticsSchema.parse(JSON.parse(buf));
  return cached;
}

export type ReturnBagAndLabel = Pick<
  ReturnLogistics,
  "bagType" | "labelService" | "tracking" | "returnCarrier" | "homePickupZipCodes"
>;

export async function getReturnBagAndLabel(): Promise<ReturnBagAndLabel> {
  const { bagType, labelService, tracking, returnCarrier, homePickupZipCodes } =
    await getReturnLogistics();
  return { bagType, labelService, tracking, returnCarrier, homePickupZipCodes };
}
