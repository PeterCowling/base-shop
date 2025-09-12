import type { AnalyticsEvent } from "@platform-core/analytics";

export type ComparisonOp = "gt" | "lt" | "gte" | "lte" | "eq";

export interface FieldFilter {
  field: string;
  value: string;
  op?: ComparisonOp;
}

export interface AndFilter {
  and: Filter[];
}

export interface OrFilter {
  or: Filter[];
}

export type Filter = FieldFilter | AndFilter | OrFilter;

export interface SegmentDef {
  id: string;
  filters: Filter | Filter[];
}

export function matches(
  filter: Filter | Filter[] | undefined,
  event: AnalyticsEvent
): boolean {
  if (!filter) return true;
  if (Array.isArray(filter)) {
    return filter.every((f) => matches(f, event));
  }
  if ("and" in filter) {
    return (filter.and ?? []).every((f) => matches(f, event));
  }
  if ("or" in filter) {
    return (filter.or ?? []).some((f) => matches(f, event));
  }

  const { field, value, op = "eq" } = filter;
  const evVal = (event as Record<string, unknown>)[field];
  if (evVal === undefined || evVal === null) return false;

  const numEv = typeof evVal === "number" ? evVal : Number(evVal);
  const numVal = Number(value);
  if (Number.isFinite(numEv) && Number.isFinite(numVal)) {
    switch (op) {
      case "gt":
        return numEv > numVal;
      case "gte":
        return numEv >= numVal;
      case "lt":
        return numEv < numVal;
      case "lte":
        return numEv <= numVal;
      default:
        return numEv === numVal;
    }
  }

  const dateEv = Date.parse(String(evVal));
  const dateVal = Date.parse(value);
  if (!Number.isNaN(dateEv) && !Number.isNaN(dateVal)) {
    switch (op) {
      case "gt":
        return dateEv > dateVal;
      case "gte":
        return dateEv >= dateVal;
      case "lt":
        return dateEv < dateVal;
      case "lte":
        return dateEv <= dateVal;
      default:
        return dateEv === dateVal;
    }
  }

  return op === "eq" && String(evVal) === value;
}
