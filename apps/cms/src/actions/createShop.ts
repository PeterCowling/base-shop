// apps/cms/src/actions/createShop.ts
"use server";

import { authOptions } from "@cms/auth/options";
import { createShop, type CreateShopOptions } from "@platform-core/createShop";
import { getServerSession } from "next-auth";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }
}

export async function createNewShop(
  id: string,
  options: CreateShopOptions
): Promise<void> {
  await ensureAuthorized();
  await createShop(id, options);
}
