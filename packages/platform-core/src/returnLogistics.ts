import type { ReturnLogistics } from "@acme/types";
import { returnLogisticsSchema } from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { resolveDataRoot } from "./dataRoot";

let cached: ReturnLogistics | null = null;

export async function getReturnLogistics(): Promise<ReturnLogistics> {
  if (cached) return cached;
  const file = path.join(resolveDataRoot(), "..", "return-logistics.json");
  const buf = await fs.readFile(file, "utf8"); // eslint-disable-line security/detect-non-literal-fs-filename
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
