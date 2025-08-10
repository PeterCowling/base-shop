// apps/cms/src/actions/createShop.ts
"use server";

import { authOptions } from "@cms/auth/options";
import {
  createShop,
  type CreateShopOptions,
  type DeployShopResult,
} from "@platform-core/createShop";
import { getServerSession } from "next-auth";
import { readRbac, writeRbac } from "../lib/rbacStore";

async function ensureAuthorized() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user?.role ?? "")) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createNewShop(
  id: string,
  options: CreateShopOptions
): Promise<DeployShopResult> {
  const session = await ensureAuthorized();

  let result: DeployShopResult;
  try {
    result = createShop(id, options);
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
