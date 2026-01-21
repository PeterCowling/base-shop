import * as fs from "node:fs";
import * as path from "node:path";

import type { DeployShopResult } from "../createShop/deployTypes";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";

export type DeployInfo = DeployShopResult;

export function readDeployInfo(shopId: string): DeployInfo | null {
  const id = validateShopName(shopId);
  const file = path.join(DATA_ROOT, id, "deploy.json");
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from validated shopId and DATA_ROOT
    const content = fs.readFileSync(file, "utf8");
    return JSON.parse(content) as DeployInfo;
  } catch {
    return null;
  }
}
