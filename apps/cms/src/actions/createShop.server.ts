// apps/cms/src/actions/createShop.ts
"use server";

import {
  createShopFromConfig,
  type DeployStatusBase,
} from "@acme/platform-core/createShop";
import type { ShopConfig } from "@acme/types";
import { prisma } from "@acme/platform-core/db";
import { readRbac, writeRbac } from "../lib/server/rbacStore";
import { ensureAuthorized } from "./common/auth";

export async function createNewShop(
  id: string,
  options: ShopConfig
): Promise<DeployStatusBase> {
  const session = await ensureAuthorized();

  let result: DeployStatusBase;
  try {
    result = await createShopFromConfig(id, options, { deploy: false });
  } catch (err) {
    console.error("createShop failed", err);
    throw err;
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return result;

  try {
    const db = await readRbac();
    const current = db.roles[userId];

    let updated: typeof current;
    if (!current) {
      updated = "ShopAdmin";
    } else if (Array.isArray(current)) {
      updated = current.includes("ShopAdmin")
        ? current
        : [...current, "ShopAdmin"];
    } else {
      updated = current === "ShopAdmin" ? current : [current, "ShopAdmin"];
    }

    if (updated !== current) {
      db.roles[userId] = updated;
      await writeRbac(db);
    }

    return result;
  } catch (err) {
    console.error("Failed to update RBAC for new shop", err);
    try {
      await prisma.page.deleteMany({ where: { shopId: id } });
      await prisma.shop.delete({ where: { id } });
    } catch (rollbackErr) {
      console.error("Failed to roll back shop creation", rollbackErr);
    }
    throw new Error("Failed to assign ShopAdmin role");
  }
}
