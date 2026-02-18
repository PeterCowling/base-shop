export type OctorateReservation = {
  createTime: Date;
  checkIn: Date;
  refer: string;
  totalRoom: number;
  room: string;
};

export type BookingChannel = "Direct" | "Booking.com" | "Hostelworld" | "Unknown";

export type BookingsByChannelRow = {
  month: string; // YYYY-MM
  channel: BookingChannel;
  bookings: number;
  gross_value: number;
  net_value: number;
  cancellations: number;
  refunds_or_adjustments: number;
  notes: string;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function requireIsoDate(iso: string): void {
  if (!ISO_DATE_RE.test(iso)) {
    throw new Error(`invalid_iso_date:${iso}`);
  }
}

export function parseIsoToLocalDate(iso: string): Date {
  requireIsoDate(iso);
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  return new Date(year, month - 1, day);
}

export function deriveChannelFromRefer(referRaw: string): BookingChannel {
  const refer = String(referRaw ?? "").trim();
  if (!refer) {
    return "Unknown";
  }

  if (/^\d{10}$/.test(refer)) {
    return "Booking.com";
  }

  if (refer.startsWith("7763-")) {
    return "Hostelworld";
  }

  if (/^[A-Za-z0-9]{6}$/.test(refer)) {
    return "Direct";
  }

  return "Unknown";
}

export function getLastCompleteCheckInMonths(asOfIso: string, count = 12): string[] {
  requireIsoDate(asOfIso);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`invalid_month_count:${String(count)}`);
  }

  const asOf = parseIsoToLocalDate(asOfIso);

  // Last complete month is the month prior to asOf's month.
  const end = new Date(asOf.getFullYear(), asOf.getMonth(), 1);
  end.setMonth(end.getMonth() - 1);

  const months: string[] = [];
  const cursor = new Date(end.getFullYear(), end.getMonth(), 1);
  cursor.setMonth(cursor.getMonth() - (count - 1));

  for (let i = 0; i < count; i += 1) {
    months.push(formatYearMonth(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function selectCanonicalReservation(candidates: OctorateReservation[]): OctorateReservation {
  if (candidates.length === 0) {
    throw new Error("empty_candidates");
  }

  // Deterministic selection:
  // 1) latest createTime
  // 2) highest totalRoom
  // 3) stable: preserve input order
  let best = candidates[0];

  for (let i = 1; i < candidates.length; i += 1) {
    const cur = candidates[i];
    const bestTime = best.createTime.getTime();
    const curTime = cur.createTime.getTime();

    if (curTime > bestTime) {
      best = cur;
      continue;
    }

    if (curTime < bestTime) {
      continue;
    }

    if (cur.totalRoom > best.totalRoom) {
      best = cur;
    }
  }

  return best;
}

export function dedupeReservationsByReferGlobal(reservations: OctorateReservation[]): OctorateReservation[] {
  const byRefer = new Map<string, OctorateReservation[]>();

  for (const reservation of reservations) {
    const refer = reservation.refer.trim();
    if (!refer) {
      continue;
    }

    const existing = byRefer.get(refer);
    if (existing) {
      existing.push(reservation);
    } else {
      byRefer.set(refer, [reservation]);
    }
  }

  const deduped: OctorateReservation[] = [];
  for (const group of byRefer.values()) {
    deduped.push(selectCanonicalReservation(group));
  }

  // Stable ordering for deterministic output.
  deduped.sort((a, b) => {
    const aKey = `${formatYearMonth(a.checkIn)}|${a.refer}`;
    const bKey = `${formatYearMonth(b.checkIn)}|${b.refer}`;
    return aKey.localeCompare(bKey);
  });

  return deduped;
}

export function aggregateBookingsByChannel(
  reservations: OctorateReservation[],
  opts: {
    asOfIso: string;
    monthCount?: number;
  },
): BookingsByChannelRow[] {
  const asOfIso = opts.asOfIso;
  const monthCount = opts.monthCount ?? 12;

  const months = getLastCompleteCheckInMonths(asOfIso, monthCount);
  const monthSet = new Set(months);

  const deduped = dedupeReservationsByReferGlobal(reservations);
  const channelsBase: BookingChannel[] = ["Direct", "Booking.com", "Hostelworld"];

  const hasUnknown = deduped.some(
    (r) => deriveChannelFromRefer(r.refer) === "Unknown" && monthSet.has(formatYearMonth(r.checkIn)),
  );
  const channels: BookingChannel[] = hasUnknown ? [...channelsBase, "Unknown"] : channelsBase;

  const buckets = new Map<string, { bookings: number; gross: number }>();

  for (const r of deduped) {
    const month = formatYearMonth(r.checkIn);
    if (!monthSet.has(month)) {
      continue;
    }
    const channel = deriveChannelFromRefer(r.refer);
    const key = `${month}|${channel}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.bookings += 1;
      existing.gross += r.totalRoom;
    } else {
      buckets.set(key, { bookings: 1, gross: r.totalRoom });
    }
  }

  const windowStart = months[0];
  const windowEnd = months[months.length - 1];

  const rows: BookingsByChannelRow[] = [];
  for (const month of months) {
    for (const channel of channels) {
      const key = `${month}|${channel}`;
      const data = buckets.get(key) ?? { bookings: 0, gross: 0 };

      const gross2dp = Math.round(data.gross * 100) / 100;

      rows.push({
        month,
        channel,
        bookings: data.bookings,
        gross_value: gross2dp,
        net_value: gross2dp,
        cancellations: 0,
        refunds_or_adjustments: 0,
        notes: [
          "source=octorate_export",
          `as_of=${asOfIso}`,
          `window=${windowStart}..${windowEnd}`,
          "month_by=check_in",
          "dedupe=refer_global",
          "canonical=latest_create_time",
          "tie_breaker=highest_total_room",
          "net_equals_gross=true",
          "not_available_from_export=true",
        ].join("; "),
      });
    }
  }

  return rows;
}

export function bookingsByChannelRowsToCsv(rows: BookingsByChannelRow[]): string {
  const header = [
    "month",
    "channel",
    "bookings",
    "gross_value",
    "net_value",
    "cancellations",
    "refunds_or_adjustments",
    "notes",
  ].join(",");

  const lines = [header];
  for (const r of rows) {
    // Notes are tokenized; avoid commas to preserve naive CSV parsing.
    const safeNotes = String(r.notes ?? "").replaceAll(",", " ");
    lines.push(
      [
        r.month,
        r.channel,
        String(r.bookings),
        r.gross_value.toFixed(2),
        r.net_value.toFixed(2),
        String(r.cancellations),
        String(r.refunds_or_adjustments),
        safeNotes,
      ].join(","),
    );
  }

  return lines.join("\n") + "\n";
}

export function parseBookingsByChannelCsv(csv: string): BookingsByChannelRow[] {
  const lines = csv.trim().split("\n");
  if (lines.length === 0) {
    throw new Error("empty_csv");
  }

  const header = lines[0];
  if (!header) {
    throw new Error("missing_header");
  }

  const rows: BookingsByChannelRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 8) {
      throw new Error(`invalid_row:line_${i + 1}`);
    }

    const month = parts[0] ?? "";
    const channel = parts[1] ?? "";
    const bookings = Number.parseInt(parts[2] ?? "0", 10);
    const grossValue = Number.parseFloat(parts[3] ?? "0");
    const netValue = Number.parseFloat(parts[4] ?? "0");
    const cancellations = Number.parseInt(parts[5] ?? "0", 10);
    const refundsOrAdjustments = Number.parseInt(parts[6] ?? "0", 10);
    const notes = parts.slice(7).join(",");

    rows.push({
      month,
      channel: channel as BookingChannel,
      bookings,
      gross_value: grossValue,
      net_value: netValue,
      cancellations,
      refunds_or_adjustments: refundsOrAdjustments,
      notes,
    });
  }

  return rows;
}
