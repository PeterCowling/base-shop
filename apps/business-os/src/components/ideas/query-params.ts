import type { Priority } from "@/lib/types";

export const PRIMARY_IDEA_PRIORITIES: Priority[] = ["P1", "P2", "P3"];
export const SECONDARY_IDEA_PRIORITIES: Priority[] = ["P4", "P5"];
export const IDEA_STATUSES = ["raw", "worked", "converted", "dropped"] as const;
export const IDEA_LOCATIONS = ["all", "inbox", "worked"] as const;
export const IDEAS_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_IDEAS_PAGE_SIZE = 50;

export type IdeaStatusFilter = (typeof IDEA_STATUSES)[number] | "all";
export type IdeaLocationFilter = (typeof IDEA_LOCATIONS)[number];
export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export type IdeasQueryState = {
  business: string;
  status: IdeaStatusFilter;
  location: IdeaLocationFilter;
  tag: string;
  q: string;
  primaryPage: number;
  primaryPageSize: number;
  secondaryPage: number;
  secondaryPageSize: number;
};

export const DEFAULT_IDEAS_QUERY_STATE: IdeasQueryState = {
  business: "",
  status: "all",
  location: "all",
  tag: "",
  q: "",
  primaryPage: 1,
  primaryPageSize: DEFAULT_IDEAS_PAGE_SIZE,
  secondaryPage: 1,
  secondaryPageSize: DEFAULT_IDEAS_PAGE_SIZE,
};

function valueToArray(value: string | string[] | undefined): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value;
  return [];
}

function getAllValues(input: SearchParamsInput, key: string): string[] {
  if (input instanceof URLSearchParams) {
    return input.getAll(key);
  }
  return valueToArray(input[key]);
}

function getFirstValue(input: SearchParamsInput, key: string): string {
  const all = getAllValues(input, key);
  return all[0]?.trim() ?? "";
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseIdeasQueryState(
  input: SearchParamsInput
): IdeasQueryState {
  const statusValue = getFirstValue(input, "status");
  const locationValue = getFirstValue(input, "location");
  const legacyPage = parsePositiveInt(getFirstValue(input, "page"), 1);
  const legacyPageSize = parsePositiveInt(
    getFirstValue(input, "pageSize"),
    DEFAULT_IDEAS_PAGE_SIZE
  );
  const primaryPageSizeValue = parsePositiveInt(
    getFirstValue(input, "primaryPageSize"),
    legacyPageSize
  );
  const secondaryPageSizeValue = parsePositiveInt(
    getFirstValue(input, "secondaryPageSize"),
    legacyPageSize
  );

  return {
    business: getFirstValue(input, "business"),
    status: IDEA_STATUSES.includes(statusValue as (typeof IDEA_STATUSES)[number])
      ? (statusValue as (typeof IDEA_STATUSES)[number])
      : "all",
    location: IDEA_LOCATIONS.includes(locationValue as (typeof IDEA_LOCATIONS)[number])
      ? (locationValue as (typeof IDEA_LOCATIONS)[number])
      : "all",
    tag: getFirstValue(input, "tag"),
    q: getFirstValue(input, "q"),
    primaryPage: parsePositiveInt(getFirstValue(input, "primaryPage"), legacyPage),
    primaryPageSize: IDEAS_PAGE_SIZE_OPTIONS.includes(
      primaryPageSizeValue as (typeof IDEAS_PAGE_SIZE_OPTIONS)[number]
    )
      ? primaryPageSizeValue
      : DEFAULT_IDEAS_PAGE_SIZE,
    secondaryPage: parsePositiveInt(
      getFirstValue(input, "secondaryPage"),
      legacyPage
    ),
    secondaryPageSize: IDEAS_PAGE_SIZE_OPTIONS.includes(
      secondaryPageSizeValue as (typeof IDEAS_PAGE_SIZE_OPTIONS)[number]
    )
      ? secondaryPageSizeValue
      : DEFAULT_IDEAS_PAGE_SIZE,
  };
}

export function buildIdeasSearchParams(
  state: IdeasQueryState,
  overrides: Partial<IdeasQueryState> = {}
): URLSearchParams {
  const next: IdeasQueryState = {
    ...state,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (next.business) params.set("business", next.business);
  if (next.status !== "all") params.set("status", next.status);
  if (next.location !== "all") params.set("location", next.location);
  if (next.tag) params.set("tag", next.tag);
  if (next.q) params.set("q", next.q);
  if (next.primaryPage > 1) params.set("primaryPage", String(next.primaryPage));
  if (next.primaryPageSize !== DEFAULT_IDEAS_PAGE_SIZE) {
    params.set("primaryPageSize", String(next.primaryPageSize));
  }
  if (next.secondaryPage > 1) {
    params.set("secondaryPage", String(next.secondaryPage));
  }
  if (next.secondaryPageSize !== DEFAULT_IDEAS_PAGE_SIZE) {
    params.set("secondaryPageSize", String(next.secondaryPageSize));
  }

  return params;
}
