// apps/cms/src/actions/createShop.ts
"use server";

import { createShop, type DeployStatusBase } from "@platform-core/createShop";
import type { CreateShopOptions } from "@platform-core/createShop/schema";
import { readRbac, writeRbac } from "../lib/rbacStore";
import { ensureAuthorized } from "./common/auth";

export async function createNewShop(
  id: string,
  options: CreateShopOptions
): Promise<DeployStatusBase> {
  const session = await ensureAuthorized();

  let result: DeployStatusBase;
  try {
    result = await createShop(id, options, { deploy: false });
  } catch (err) {
    console.error("createShop failed", err);
    throw err;
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return result;

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
}
