import { describe, expect, it, vi } from "vitest";

import { generateTransactionId } from "../generateTransactionId";

function expectedId(date: Date) {
  const parts = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const second = parts.find((p) => p.type === "second")?.value ?? "";
  const fraction =
    parts.find((p) => p.type === "fractionalSecond")?.value ?? "000";
  return `txn_${year}${month}${day}${hour}${minute}${second}${fraction}`;
}

describe("generateTransactionId", () => {
  it("formats the ID as txn_YYYYMMDDhhmmssfff", () => {
    const fakeDate = new Date("2024-05-03T14:15:16.789Z");
    vi.useFakeTimers();
    vi.setSystemTime(fakeDate);

    const id = generateTransactionId();
    expect(id).toBe(expectedId(fakeDate));

    vi.useRealTimers();
  });

  it("produces unique IDs across calls", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-03T14:15:16.789Z"));

    const first = generateTransactionId();
    vi.advanceTimersByTime(1);
    const second = generateTransactionId();

    expect(first).not.toBe(second);

    vi.useRealTimers();
  });
});
