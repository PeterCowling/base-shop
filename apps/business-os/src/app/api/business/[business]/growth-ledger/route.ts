import path from "node:path";

import { NextResponse } from "next/server";

import { readGrowthLedger } from "@acme/lib/server";

import { BUSINESSES } from "@/lib/business-catalog";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getRepoRoot } from "@/lib/get-repo-root";

interface RouteContext {
  params: Promise<{ business: string }>;
}

function isValidBusinessCode(value: string): boolean {
  return /^[A-Z0-9-]{2,16}$/.test(value);
}

function canReadBusiness(user: { role: "admin" | "user"; name: string }, owner: string): boolean {
  if (user.role === "admin") {
    return true;
  }

  return user.name.toLowerCase() === owner.toLowerCase();
}

export async function GET(_request: Request, context: RouteContext) {
  const { business } = await context.params;

  if (!isValidBusinessCode(business)) {
    return NextResponse.json(
      { error: "invalid_business_code", business },
      { status: 400 },
    );
  }

  const businessRecord = BUSINESSES.find((entry) => entry.id === business);
  if (!businessRecord) {
    return NextResponse.json(
      { error: "business_not_found", business },
      { status: 404 },
    );
  }

  const currentUser = await getCurrentUserServer();
  if (!canReadBusiness(currentUser, businessRecord.owner)) {
    return NextResponse.json(
      { error: "unauthorized_business_access", business },
      { status: 403 },
    );
  }

  const dataRoot = path.join(getRepoRoot(), "data", "shops");

  try {
    const ledger = await readGrowthLedger(business, { dataRoot });
    if (!ledger) {
      return NextResponse.json(
        { error: "ledger_not_initialized", business },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { business, ledger },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "ledger_read_failed",
        business,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
