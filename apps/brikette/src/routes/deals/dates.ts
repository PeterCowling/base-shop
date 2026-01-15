const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type ParsedIsoDate = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
};

const isIntegerInRange = (value: number, min: number, max: number): boolean =>
  Number.isInteger(value) && value >= min && value <= max;

export const parseIsoDate = (value: string): ParsedIsoDate => {
  if (!ISO_DATE_REGEX.test(value)) {
    throw new Error(`Invalid ISO date (expected YYYY-MM-DD): ${value}`);
  }

  const [yStr, mStr, dStr] = value.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);

  if (!isIntegerInRange(year, 1970, 9999)) {
    throw new Error(`Invalid ISO date year: ${value}`);
  }

  if (!isIntegerInRange(month, 1, 12)) {
    throw new Error(`Invalid ISO date month: ${value}`);
  }

  if (!isIntegerInRange(day, 1, 31)) {
    throw new Error(`Invalid ISO date day: ${value}`);
  }

  return { year, month, day };
};

export const isoDateToLocalStart = (value: string): Date => {
  const { year, month, day } = parseIsoDate(value);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const isoDateToLocalEndInclusive = (value: string): Date => {
  const { year, month, day } = parseIsoDate(value);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

type DateFormatOptions = {
  includeYear?: boolean;
};

export const formatMonthDay = (lang: string, date: Date, options: DateFormatOptions = {}): string => {
  const { includeYear = false } = options;
  return new Intl.DateTimeFormat(lang, {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
};

export const shouldIncludeYear = (referenceDate: Date, start: Date, end: Date): boolean => {
  const currentYear = referenceDate.getFullYear();
  if (start.getFullYear() !== end.getFullYear()) {
    return true;
  }
  return start.getFullYear() !== currentYear;
};

export const formatDateRange = (
  lang: string,
  start: Date,
  end: Date,
  referenceDate: Date,
): string => {
  const includeYear = shouldIncludeYear(referenceDate, start, end);
  return `${formatMonthDay(lang, start, { includeYear })}–${formatMonthDay(lang, end, { includeYear })}`;
};

export const formatPercent = (lang: string, percent: number): string => {
  return new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 0 }).format(percent / 100);
};
