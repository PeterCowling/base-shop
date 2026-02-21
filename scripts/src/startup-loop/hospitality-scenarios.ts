export type HospitalityScenarioKey = "s1" | "s2" | "s3";

export type HospitalityScenarioInputs = {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  travellers: number;
};

export type HospitalityScenarioSet<T> = { s1: T; s2: T; s3: T };

function dayOfWeekLabelUtc(date: Date): string {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  return labels[date.getUTCDay()] ?? "n/a";
}

function formatIsoDateUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nthWeekdayOfMonthUtc(args: {
  year: number;
  month1to12: number;
  weekday0SunTo6Sat: number;
  n: number;
}): Date {
  // Example: 3rd Friday of July => weekday=5 (Fri), n=3.
  const monthIndex = args.month1to12 - 1;
  const first = new Date(Date.UTC(args.year, monthIndex, 1));
  const firstDow = first.getUTCDay();
  const offset = (args.weekday0SunTo6Sat - firstDow + 7) % 7;
  const day = 1 + offset + (args.n - 1) * 7;
  return new Date(Date.UTC(args.year, monthIndex, day));
}

function fourthTuesdayOfFebruaryUtc(year: number): Date {
  return nthWeekdayOfMonthUtc({ year, month1to12: 2, weekday0SunTo6Sat: 2, n: 4 });
}

function computeHospitalityScenarioDatesUtc(asOfDate: string): {
  s1Start: Date;
  s1End: Date;
  s2Start: Date;
  s2End: Date;
  s3Start: Date;
  s3End: Date;
} {
  const asOfYear = Number(asOfDate.slice(0, 4));
  const asOfMonth = Number(asOfDate.slice(5, 7));
  const yearForPeak = asOfMonth <= 8 ? asOfYear : asOfYear + 1;
  const yearForShoulder = asOfMonth <= 9 ? asOfYear : asOfYear + 1;
  const yearForOffSeason = asOfMonth <= 2 ? asOfYear : asOfYear + 1;

  // S1: 3rd Friday-Sunday of July in the chosen year.
  const s1Start = nthWeekdayOfMonthUtc({ year: yearForPeak, month1to12: 7, weekday0SunTo6Sat: 5, n: 3 });
  const s1End = new Date(Date.UTC(yearForPeak, 6, s1Start.getUTCDate() + 2));

  // S2: 2nd Tuesday-Thursday of May in the chosen year.
  const s2Start = nthWeekdayOfMonthUtc({ year: yearForShoulder, month1to12: 5, weekday0SunTo6Sat: 2, n: 2 });
  const s2End = new Date(Date.UTC(yearForShoulder, 4, s2Start.getUTCDate() + 2));

  // S3: 4th Tuesday-Thursday of February in the chosen year.
  const s3Start = fourthTuesdayOfFebruaryUtc(yearForOffSeason);
  const s3End = new Date(Date.UTC(yearForOffSeason, 1, s3Start.getUTCDate() + 2));

  return { s1Start, s1End, s2Start, s2End, s3Start, s3End };
}

export function computeHospitalityScenarioInputs(asOfDate: string): HospitalityScenarioSet<HospitalityScenarioInputs> {
  const { s1Start, s1End, s2Start, s2End, s3Start, s3End } = computeHospitalityScenarioDatesUtc(asOfDate);
  return {
    s1: { checkIn: formatIsoDateUtc(s1Start), checkOut: formatIsoDateUtc(s1End), travellers: 1 },
    s2: { checkIn: formatIsoDateUtc(s2Start), checkOut: formatIsoDateUtc(s2End), travellers: 1 },
    s3: { checkIn: formatIsoDateUtc(s3Start), checkOut: formatIsoDateUtc(s3End), travellers: 1 },
  };
}

export function computeHospitalityScenarioDateLabels(asOfDate: string): HospitalityScenarioSet<string> {
  const { s1Start, s1End, s2Start, s2End, s3Start, s3End } = computeHospitalityScenarioDatesUtc(asOfDate);
  const s1 = `${formatIsoDateUtc(s1Start)} (${dayOfWeekLabelUtc(s1Start)}) to ${formatIsoDateUtc(s1End)} (${dayOfWeekLabelUtc(s1End)})`;
  const s2 = `${formatIsoDateUtc(s2Start)} (${dayOfWeekLabelUtc(s2Start)}) to ${formatIsoDateUtc(s2End)} (${dayOfWeekLabelUtc(s2End)})`;
  const s3 = `${formatIsoDateUtc(s3Start)} (${dayOfWeekLabelUtc(s3Start)}) to ${formatIsoDateUtc(s3End)} (${dayOfWeekLabelUtc(s3End)})`;
  return { s1, s2, s3 };
}

