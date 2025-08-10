// apps/cms/src/actions/themes.server.ts
"use server";

import { authOptions } from "@cms/auth/options";
import { getShopById, updateShopInRepo } from "@platform-core/src/repositories/shop.server";
import { syncThemeTokens } from "@platform-core/createShop";
import type { Shop } from "@types";
import { getServerSession } from "next-auth";
import { z } from "zod";

const themeSchema = z
  .object({
    id: z.string(),
    themeId: z.string().min(1, "Required"),
    themeTokens: z
      .string()
      .optional()
      .default("{}")
      .transform((s, ctx) => {
        try {
          return s ? (JSON.parse(s) as Record<string, string>) : {};
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
          return {};
        }
      }),
  })
  .strict();

export async function updateTheme(
  shop: string,
  formData: FormData
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "viewer") {
    throw new Error("Forbidden");
  }

  const parsed = themeSchema.safeParse(
    Object.fromEntries(formData as unknown as Iterable<[string, FormDataEntryValue]>)
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const current = await getShopById<Shop>(shop);
  if (current.id !== data.id) {
    throw new Error(`Shop ${data.id} not found in ${shop}`);
  }

  const themeTokens = syncThemeTokens(data.themeId, data.themeTokens);
  const saved = await updateShopInRepo(shop, {
    id: current.id,
    themeId: data.themeId,
    themeTokens,
  });

  return { shop: saved };
}

