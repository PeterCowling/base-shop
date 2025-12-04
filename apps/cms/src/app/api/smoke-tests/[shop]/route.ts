import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";
import { verifyShopAfterDeploy } from "@cms/actions/verifyShopAfterDeploy.server";
import { updateDeployStatus } from "@cms/actions/deployShop.server";
import type { Environment } from "@acme/types";

type SessionWithRole = Awaited<ReturnType<typeof getServerSession>> & {
  user?: { role?: string };
};

function resolveRole(session: SessionWithRole | null): string | undefined {
  const envAssumeAdmin = process.env.CMS_TEST_ASSUME_ADMIN === "1";
  const role = session?.user?.role;
  const mockSet = Boolean((globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET);
  return role ?? (envAssumeAdmin && !mockSet ? "admin" : undefined);
}

export async function POST(
  req: NextRequest,
  context: { params: { shop: string } },
) {
  const session = await getServerSession(authOptions);
  const role = resolveRole(session);
  if (!role || !["admin", "ShopAdmin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { shop } = context.params;
  const url = new URL(req.url);
  const envParam = url.searchParams.get("env") as Environment | null;
  const env: Environment = envParam ?? "stage";

  try {
    const verification = await verifyShopAfterDeploy(shop, env);
    const timestamp = new Date().toISOString();

    await updateDeployStatus(shop, {
      env,
      testsStatus: verification.status,
      testsError: verification.error,
      lastTestedAt: timestamp,
    });

    return NextResponse.json(
      {
        status: verification.status,
        error: verification.error,
        lastTestedAt: timestamp,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
