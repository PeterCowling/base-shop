const DEFAULT_RANGE_DAYS = 90;

function requireIsoDate(raw) {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`invalid_iso_date:${String(raw)}`);
  }
}

function isoFromLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoToLocalDate(iso) {
  requireIsoDate(iso);
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  return new Date(year, month - 1, day);
}

function normalizeTimeFilter(raw) {
  if (raw === "create_time") return "create_time";
  if (raw === "check_in") return "check_in";
  throw new Error(`invalid_time_filter:${String(raw)}`);
}

function timeFilterToOptionLabel(timeFilter) {
  if (timeFilter === "create_time") return "Create time";
  if (timeFilter === "check_in") return "Check in";
  // Defensive: normalizeTimeFilter should prevent this.
  return "Create time";
}

function parseOctorateExportArgs(argv, now) {
  const args = Array.isArray(argv) ? argv.slice() : [];
  const clock = now instanceof Date ? now : new Date();

  let timeFilter = "create_time";
  let startIso = null;
  let endIso = null;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--time-filter") {
      const value = args[i + 1];
      timeFilter = normalizeTimeFilter(value);
      i += 1;
      continue;
    }
    if (token === "--start") {
      const value = args[i + 1];
      requireIsoDate(value);
      startIso = value;
      i += 1;
      continue;
    }
    if (token === "--end") {
      const value = args[i + 1];
      requireIsoDate(value);
      endIso = value;
      i += 1;
      continue;
    }
    throw new Error(`unknown_arg:${String(token)}`);
  }

  const endDate = new Date(clock.getFullYear(), clock.getMonth(), clock.getDate());
  const end = endIso ?? isoFromLocalDate(endDate);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - DEFAULT_RANGE_DAYS);
  const start = startIso ?? isoFromLocalDate(startDate);

  // Validate final range ordering.
  const startLocal = parseIsoToLocalDate(start);
  const endLocal = parseIsoToLocalDate(end);
  if (startLocal.getTime() > endLocal.getTime()) {
    throw new Error(`invalid_date_range:${start}..${end}`);
  }

  return { timeFilter, startIso: start, endIso: end };
}

module.exports = {
  parseIsoToLocalDate,
  parseOctorateExportArgs,
  timeFilterToOptionLabel,
};

