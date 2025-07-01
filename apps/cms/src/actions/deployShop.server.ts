// apps/cms/src/actions/deployShop.server.ts
"use server";

import { authOptions } from "@cms/auth/options";
import { deployShop } from "@platform-core/createShop";
import { getServerSession } from "next-auth";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }
}

export async function deployShopHosting(id: string): Promise<void> {
  await ensureAuthorized();
  await deployShop(id);
}
