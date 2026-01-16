import "@acme/zod-utils/initZod";
import { ensureRole } from "@cms/actions/common/auth";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { validateShopName } from "@platform-core/shops";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { writeJsonFile } from "@/lib/server/jsonIO";

/**
 * POST /cms/api/configurator/init-shop
 * Body: { id: string; csv?: string; categories?: string[] }
 * Seeds categories and product CSV for a shop.
 */
export async function POST(req: Request) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const schema = z
      .object({
        id: z
          .string()
          .transform((s) => validateShopName(s)),
        csv: z
          .string()
          .optional()
          .transform((s) => (s ? s.replace(/\s+/g, "") : s))
          .refine((val) => {
            if (!val) return true;
            try {
              return (
                Buffer.from(val, "base64").toString("base64").replace(/=+$/, "") ===
                val.replace(/=+$/, "")
              );
            } catch {
              return false;
            }
          }),
        categories: z.array(z.string()).optional(),
      })
      .strict();

    const parsed = await parseJsonBody(
      req as Request & { body: ReadableStream<Uint8Array> | null },
      schema,
      "1mb",
    );
    if ("response" in parsed) {
      return parsed.response;
    }

    const { id, csv, categories } = parsed.data;
    const dir = path.join(resolveDataRoot(), id);
    // Directory path constrained by validated shop id
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Dir name comes from validated shop id
    await fs.mkdir(dir, { recursive: true });
    if (csv) {
      const buf = Buffer.from(csv, "base64");
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: Writing to fixed filename within validated dir
      await fs.writeFile(path.join(dir, "products.csv"), buf);
    }
    if (categories) {
      await writeJsonFile(path.join(dir, "categories.json"), categories);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const key =
      error instanceof Error && error.message ? error.message : "api.common.invalidRequest";
    return NextResponse.json({ error: key }, { status: 400 });
  }
}
