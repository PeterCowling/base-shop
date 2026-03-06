const OCTORATE_RESERVATION_BASE = "https://book.octorate.com/octobook/site/reservation" as const;

export const OCTORATE_CALENDAR_ENDPOINT = `${OCTORATE_RESERVATION_BASE}/calendar.xhtml` as const;
export const OCTORATE_RESULT_ENDPOINT = `${OCTORATE_RESERVATION_BASE}/result.xhtml` as const;

type OctorateCalendarParams = Record<string, string | number | null | undefined>;

export function buildOctorateCalendarUrl(params: OctorateCalendarParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    const normalized = String(value).trim();
    if (!normalized) continue;

    searchParams.set(key, normalized);
  }

  return `${OCTORATE_CALENDAR_ENDPOINT}?${searchParams.toString()}`;
}
