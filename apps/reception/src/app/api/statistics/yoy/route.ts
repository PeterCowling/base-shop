import { NextResponse } from "next/server";

import { Permissions } from "../../../../lib/roles";
import { requireStaffAuth } from "../../mcp/_shared/staff-auth";

type RevenueMode = "room-only" | "room-plus-bar";

type FinancialTransaction = {
  amount?: number;
  timestamp?: string;
  type?: string;
  itemCategory?: string;
  voidedAt?: string;
};

type FinancialTransactionMap = Record<string, FinancialTransaction>;

function readDbUrls(): { currentDbUrl: string; archiveDbUrl?: string } | null {
  const currentDbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();
  if (!currentDbUrl) {
    return null;
  }

  const archiveDbUrl =
    process.env.NEXT_PUBLIC_FIREBASE_ARCHIVE_DATABASE_URL?.trim() || undefined;

  return {
    currentDbUrl: currentDbUrl.replace(/\/+$/, ""),
    archiveDbUrl: archiveDbUrl?.replace(/\/+$/, ""),
  };
}

function extractBearerToken(request: Request): string {
  return (
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ??
    ""
  );
}

function monthKey(timestamp: string): string | null {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getUTCFullYear();
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function isBarTransaction(transaction: FinancialTransaction): boolean {
  const type = transaction.type?.toLowerCase() ?? "";
  if (type.includes("bar") || type.includes("preorder")) {
    return true;
  }

  const category = transaction.itemCategory?.toLowerCase() ?? "";
  if (["coffee", "tea", "juices", "beer", "wine", "cocktails"].includes(category)) {
    return true;
  }

  return false;
}

function includeTransactionByMode(
  transaction: FinancialTransaction,
  mode: RevenueMode,
): boolean {
  if (transaction.voidedAt) {
    return false;
  }

  if (mode === "room-plus-bar") {
    return true;
  }

  return !isBarTransaction(transaction);
}

function aggregateMonthlyRevenue(
  transactions: FinancialTransactionMap | null,
  year: number,
  mode: RevenueMode,
): Record<string, number> {
  const monthly: Record<string, number> = {};
  for (let month = 1; month <= 12; month += 1) {
    monthly[`${year}-${`${month}`.padStart(2, "0")}`] = 0;
  }

  for (const transaction of Object.values(transactions ?? {})) {
    if (!includeTransactionByMode(transaction, mode)) {
      continue;
    }

    const ts = transaction.timestamp;
    if (!ts) {
      continue;
    }

    const key = monthKey(ts);
    if (!key || !key.startsWith(`${year}-`)) {
      continue;
    }

    const amount = Number(transaction.amount ?? 0);
    if (!Number.isFinite(amount)) {
      continue;
    }

    monthly[key] = (monthly[key] ?? 0) + amount;
  }

  return monthly;
}

function ytdSum(monthly: Record<string, number>, year: number): number {
  const now = new Date();
  const upToMonth = now.getUTCFullYear() === year ? now.getUTCMonth() + 1 : 12;

  let total = 0;
  for (let month = 1; month <= upToMonth; month += 1) {
    total += monthly[`${year}-${`${month}`.padStart(2, "0")}`] ?? 0;
  }
  return total;
}

async function fetchNode<T>(
  dbUrl: string,
  token: string,
  path: string,
): Promise<T | null> {
  const url = `${dbUrl}/${path}.json?auth=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T | null;
}

function sanitizeMode(rawMode: string | null): RevenueMode {
  return rawMode === "room-only" ? "room-only" : "room-plus-bar";
}

function sanitizeYear(rawYear: string | null): number {
  const nowYear = new Date().getUTCFullYear();
  const parsed = Number(rawYear ?? nowYear);
  if (!Number.isInteger(parsed) || parsed < 2020 || parsed > nowYear + 1) {
    return nowYear;
  }
  return parsed;
}

export async function GET(request: Request): Promise<Response> {
  const authResult = await requireStaffAuth(request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const statsRoles = new Set<string>(Permissions.STATISTICS_ACCESS);
  if (!authResult.roles.some((role) => statsRoles.has(role))) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Missing bearer token" },
      { status: 401 },
    );
  }

  const urls = readDbUrls();
  if (!urls) {
    return NextResponse.json(
      { success: false, error: "Server configuration missing" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = sanitizeMode(searchParams.get("mode"));
  const year = sanitizeYear(searchParams.get("year"));
  const previousYear = year - 1;

  const currentTransactions = await fetchNode<FinancialTransactionMap>(
    urls.currentDbUrl,
    token,
    "allFinancialTransactions",
  );

  const previousTransactions = urls.archiveDbUrl
    ? await fetchNode<FinancialTransactionMap>(
        urls.archiveDbUrl,
        token,
        "allFinancialTransactions",
      )
    : await fetchNode<FinancialTransactionMap>(
        urls.currentDbUrl,
        token,
        "archive/allFinancialTransactions",
      );

  const currentMonthly = aggregateMonthlyRevenue(currentTransactions, year, mode);
  const previousMonthly = aggregateMonthlyRevenue(
    previousTransactions,
    previousYear,
    mode,
  );

  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}`.padStart(2, "0"));
  const monthly = months.map((month) => {
    const currentKey = `${year}-${month}`;
    const previousKey = `${previousYear}-${month}`;

    const currentValue = Number((currentMonthly[currentKey] ?? 0).toFixed(2));
    const previousValue = Number((previousMonthly[previousKey] ?? 0).toFixed(2));
    const delta = currentValue - previousValue;
    const deltaPct =
      previousValue === 0
        ? null
        : Number(((delta / previousValue) * 100).toFixed(2));

    return {
      month,
      currentValue,
      previousValue,
      delta: Number(delta.toFixed(2)),
      deltaPct,
    };
  });

  const currentYtd = Number(ytdSum(currentMonthly, year).toFixed(2));
  const previousYtd = Number(ytdSum(previousMonthly, previousYear).toFixed(2));
  const ytdDelta = Number((currentYtd - previousYtd).toFixed(2));
  const ytdDeltaPct =
    previousYtd === 0
      ? null
      : Number(((ytdDelta / previousYtd) * 100).toFixed(2));

  return NextResponse.json({
    success: true,
    mode,
    year,
    previousYear,
    monthly,
    summary: {
      currentYtd,
      previousYtd,
      ytdDelta,
      ytdDeltaPct,
    },
    source: {
      current: "allFinancialTransactions",
      previous: urls.archiveDbUrl
        ? "archive-db:allFinancialTransactions"
        : "current-db:archive/allFinancialTransactions",
    },
  });
}
