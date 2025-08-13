import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { validateShopName } from "@platform-core/src/shops";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

/**
 * POST /cms/api/configurator/init-shop
 * Body: { id: string; csv?: string; categories?: string[] }
 * Seeds categories and product CSV for a shop.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const schema = z
      .object({
        id: z
          .string()
          .transform((s) => validateShopName(s)),
        csv: z
          .string()
          .optional()
          .transform((s) => s.replace(/\s+/g, ""))
          .refine(
            (val) => {
              if (!val) return true;
              try {
                return (
                  Buffer.from(val, "base64").toString("base64").replace(/=+$/, "") ===
                  val.replace(/=+$/, "")
                );
              } catch {
                return false;
              }
            },
            { message: "Invalid CSV encoding" }
          ),
        categories: z.array(z.string()).optional(),
      })
      .strict();

    const parsed = await parseJsonBody(req, schema);
    if (!parsed.success) return parsed.response;

    const { id, csv, categories } = parsed.data;
    const dir = path.join(resolveDataRoot(), id);
    await fs.mkdir(dir, { recursive: true });
    if (csv) {
      const buf = Buffer.from(csv, "base64");
      await fs.writeFile(path.join(dir, "products.csv"), buf);
    }
    if (categories) {
      await fs.writeFile(
        path.join(dir, "categories.json"),
        JSON.stringify(categories, null, 2),
        "utf8"
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
