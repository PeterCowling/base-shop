import { NextResponse } from "next/server";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { requirePermission } from "@acme/auth";
import { verifyShopAfterDeploy } from "@cms/actions/verifyShopAfterDeploy.server";
import { updateDeployStatus } from "@cms/actions/deployShop.server";
import type { Environment } from "@acme/types";
import { incrementOperationalError } from "@acme/platform-core/shops/health";
import { recordMetric } from "@acme/platform-core/utils/metrics";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shop } = await params;
  try {
    const root = join(process.cwd(), "..", "..");
    const run = promisify(execFile);
    await run("pnpm", ["ts-node", "scripts/src/republish-shop.ts", shop], {
      cwd: root,
    });
    const env: Environment = "prod";
    const timestamp = new Date().toISOString();
    try {
      const verification = await verifyShopAfterDeploy(shop, env);
      await updateDeployStatus(shop, {
        env,
        testsStatus: verification.status,
        testsError: verification.error,
        lastTestedAt: timestamp,
      });
      recordMetric("upgrade_republish_total", {
        shopId: shop,
        status: verification.status === "passed" ? "success" : "failure",
        service: "cms",
      });
    } catch (err) {
      await updateDeployStatus(shop, {
        env,
        testsStatus: "failed",
        testsError:
          (err as Error).message || "post-deploy verification failed",
        lastTestedAt: timestamp,
      });
      recordMetric("upgrade_republish_total", {
        shopId: shop,
        status: "failure",
        service: "cms",
      });
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    incrementOperationalError(shop);
    // i18n-exempt -- CMS-300 internal log label; not user-facing copy
    console.error("Republish failed", err);
    return NextResponse.json({ error: "Republish failed" }, { status: 500 });
  }
}
