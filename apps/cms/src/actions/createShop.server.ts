// apps/cms/src/actions/createShop.ts
"use server";

import { authOptions } from "@cms/auth/options";
import { createShop, type CreateShopOptions } from "@platform-core/createShop";
import { getServerSession } from "next-auth";
import { readRbac, writeRbac } from "../lib/rbacStore";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user?.role ?? "")) {
    throw new Error("Forbidden");
  }
}

export async function createNewShop(
  id: string,
  options: CreateShopOptions
): Promise<void> {
  await ensureAuthorized();

  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Forbidden");

  try {
    await createShop(id, options);
  } catch (err) {
    console.error("createShop failed", err);
    throw err;
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return;

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
}
