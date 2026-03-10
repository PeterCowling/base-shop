import { NextResponse } from "next/server";

import { Permissions } from "../../../../lib/roles";
import {
  aggregateMonthlyRevenue,
  buildYoYProvenance,
  buildYoYSourceLabels,
  sanitizeRevenueMode,
  sanitizeYoYYear,
  ytdSum,
} from "../../../../lib/statistics/yoyContract";
import {
  type StatisticsYoyResponse,
  statisticsYoyResponseSchema,
} from "../../../../schemas/statisticsYoySchema";
import { requireStaffAuth } from "../../mcp/_shared/staff-auth";

type FinancialTransaction = {
  amount?: number;
  timestamp?: string;
  type?: string;
  itemCategory?: string;
  voidedAt?: string;
};

type FinancialTransactionMap = Record<string, FinancialTransaction>;

function readDbUrls(): { currentDbUrl: string; archiveDbUrl?: string } | null {
  const currentDbUrl =
    process.env.RECEPTION_FIREBASE_DATABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();
  if (!currentDbUrl) {
    return null;
  }

  const archiveDbUrl =
    process.env.RECEPTION_FIREBASE_ARCHIVE_DATABASE_URL?.trim() ||
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

async function fetchNode<T>(
  dbUrl: string,
  token: string,
  path: string,
): Promise<{ ok: true; data: T | null } | { ok: false; error: string }> {
  const url = `${dbUrl}/${path}.json?auth=${encodeURIComponent(token)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        ok: false,
        error: `Upstream fetch failed for ${path} (${response.status})`,
      };
    }
    return { ok: true, data: (await response.json()) as T | null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Upstream fetch threw for ${path}: ${error.message}`
          : `Upstream fetch threw for ${path}`,
    };
  }
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
  const mode = sanitizeRevenueMode(searchParams.get("mode"));
  const year = sanitizeYoYYear(searchParams.get("year"));
  const previousYear = year - 1;
  const hasDedicatedArchiveDb = Boolean(urls.archiveDbUrl);

  const [currentResult, previousResult] = await Promise.all([
    fetchNode<FinancialTransactionMap>(urls.currentDbUrl, token, "allFinancialTransactions"),
    urls.archiveDbUrl
      ? fetchNode<FinancialTransactionMap>(urls.archiveDbUrl, token, "allFinancialTransactions")
      : fetchNode<FinancialTransactionMap>(urls.currentDbUrl, token, "archive/allFinancialTransactions"),
  ]);
  if (currentResult.ok === false) {
    return NextResponse.json(
      { success: false, error: currentResult.error },
      { status: 502 },
    );
  }
  if (previousResult.ok === false) {
    return NextResponse.json(
      { success: false, error: previousResult.error },
      { status: 502 },
    );
  }

  const currentMonthly = aggregateMonthlyRevenue(currentResult.data, year, mode);
  const previousMonthly = aggregateMonthlyRevenue(
    previousResult.data,
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

  const provenance = buildYoYProvenance({
    currentTransactions: currentResult.data,
    previousTransactions: previousResult.data,
    hasDedicatedArchiveDb,
  });

  const payload: StatisticsYoyResponse = {
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
    source: buildYoYSourceLabels(provenance.previousSource),
    provenance,
  };

  return NextResponse.json(statisticsYoyResponseSchema.parse(payload));
}
