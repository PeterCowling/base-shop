// apps/cms/src/app/api/launch-status/[shop]/route.ts
import "@acme/zod-utils/initZod";
import { ensureRole } from "@cms/actions/common/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getLaunchStatus } from "@platform-core/configurator";
import type { LaunchEnv, LaunchCheckResult } from "@acme/types";

const ENVS: LaunchEnv[] = ["dev", "stage", "prod"];

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { shop } = await context.params;

  try {
    const results: LaunchCheckResult[] = await Promise.all(
      ENVS.map((env) => getLaunchStatus(env, shop)),
    );
    return NextResponse.json(
      {
        shopId: shop,
        environments: results,
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message)
        : "launch-status.failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

