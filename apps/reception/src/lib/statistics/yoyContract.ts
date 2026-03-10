import {
  type RevenueMode,
  type StatisticsYoyPreviousSourceDescriptor,
  type StatisticsYoyProvenance,
  type StatisticsYoySourceDescriptor,
  type StatisticsYoySourceLabels,
} from "../../schemas/statisticsYoySchema";

type YoYFinancialTransaction = {
  amount?: number;
  itemCategory?: string;
  timestamp?: string;
  type?: string;
  voidedAt?: string;
};

type YoYFinancialTransactionMap = Record<string, YoYFinancialTransaction> | null;

export const YOY_CURRENT_SOURCE_PATH = "allFinancialTransactions";
export const YOY_ARCHIVE_MIRROR_SOURCE_PATH = "archive/allFinancialTransactions";

export const YOY_RULES: StatisticsYoyProvenance["rules"] = {
  timezone: "UTC",
  monthBoundary: "utc-calendar-month",
  ytdWindow: "january-through-current-utc-month",
  excludeVoidedTransactions: true,
  roomOnlyExcludesBarTransactions: true,
  roomPlusBarIncludesEligibleBarTransactions: true,
};

const BAR_CATEGORY_KEYWORDS = new Set([
  "coffee",
  "tea",
  "juices",
  "beer",
  "wine",
  "cocktails",
]);

function hasTransactions(transactions: YoYFinancialTransactionMap): boolean {
  return Object.keys(transactions ?? {}).length > 0;
}

export function monthKeyUtc(timestamp: string | undefined): string | null {
  if (!timestamp) {
    return null;
  }
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getUTCFullYear();
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function isBarTransaction(transaction: Pick<YoYFinancialTransaction, "type" | "itemCategory">): boolean {
  const type = transaction.type?.toLowerCase() ?? "";
  if (type.includes("bar") || type.includes("preorder")) {
    return true;
  }

  const category = transaction.itemCategory?.toLowerCase() ?? "";
  return BAR_CATEGORY_KEYWORDS.has(category);
}

export function includeTransactionByMode(
  transaction: Pick<YoYFinancialTransaction, "type" | "itemCategory" | "voidedAt">,
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

export function emptyMonthlySeries(year: number): Record<string, number> {
  const monthly: Record<string, number> = {};
  for (let month = 1; month <= 12; month += 1) {
    monthly[`${year}-${`${month}`.padStart(2, "0")}`] = 0;
  }
  return monthly;
}

export function aggregateMonthlyRevenue(
  transactions: YoYFinancialTransactionMap,
  year: number,
  mode: RevenueMode,
): Record<string, number> {
  const monthly = emptyMonthlySeries(year);

  for (const transaction of Object.values(transactions ?? {})) {
    if (!includeTransactionByMode(transaction, mode)) {
      continue;
    }

    const key = monthKeyUtc(transaction.timestamp);
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

export function ytdSum(
  monthly: Record<string, number>,
  year: number,
  now: Date = new Date(),
): number {
  const upToMonth = now.getUTCFullYear() === year ? now.getUTCMonth() + 1 : 12;

  let total = 0;
  for (let month = 1; month <= upToMonth; month += 1) {
    total += monthly[`${year}-${`${month}`.padStart(2, "0")}`] ?? 0;
  }
  return total;
}

export function sanitizeRevenueMode(rawMode: string | null): RevenueMode {
  return rawMode === "room-only" ? "room-only" : "room-plus-bar";
}

export function sanitizeYoYYear(rawYear: string | null, now: Date = new Date()): number {
  const nowYear = now.getUTCFullYear();
  const parsed = Number(rawYear ?? nowYear);
  if (!Number.isInteger(parsed) || parsed < 2020 || parsed > nowYear + 1) {
    return nowYear;
  }
  return parsed;
}

export function buildYoYSourceLabels(previousSource: StatisticsYoyPreviousSourceDescriptor): StatisticsYoySourceLabels {
  return {
    current: YOY_CURRENT_SOURCE_PATH,
    previous:
      previousSource.sourceKind === "dedicated-archive-db"
        ? "archive-db:allFinancialTransactions"
        : "current-db:archive/allFinancialTransactions",
  };
}

export function buildYoYProvenance(options: {
  currentTransactions: YoYFinancialTransactionMap;
  previousTransactions: YoYFinancialTransactionMap;
  hasDedicatedArchiveDb: boolean;
}): StatisticsYoyProvenance {
  const currentSource: StatisticsYoySourceDescriptor = {
    database: "current-db",
    path: YOY_CURRENT_SOURCE_PATH,
    availability: hasTransactions(options.currentTransactions) ? "available" : "empty",
  };

  const previousSource: StatisticsYoyPreviousSourceDescriptor = {
    database: options.hasDedicatedArchiveDb ? "archive-db" : "current-db",
    path: options.hasDedicatedArchiveDb
      ? YOY_CURRENT_SOURCE_PATH
      : YOY_ARCHIVE_MIRROR_SOURCE_PATH,
    availability: hasTransactions(options.previousTransactions) ? "available" : "empty",
    sourceKind: options.hasDedicatedArchiveDb
      ? "dedicated-archive-db"
      : "archive-mirror",
    fallbackUsed: !options.hasDedicatedArchiveDb,
  };

  return {
    rules: YOY_RULES,
    currentSource,
    previousSource,
  };
}
