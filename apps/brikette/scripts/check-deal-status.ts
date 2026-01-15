/* eslint-disable ds/no-hardcoded-copy -- TEST-1002: CLI-only assertions, not user-facing. [ttl=2026-12-31] */
import { DEALS } from "../src/routes/deals/deals";
import { getDealStatus } from "../src/routes/deals/status";

const assertEqual = (actual: unknown, expected: unknown, message: string) => {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nReceived: ${String(actual)}`);
  }
};

const run = () => {
  const deal = DEALS.find((candidate) => candidate.id === "sep20_oct31_15off") ?? DEALS[0];
  if (!deal) {
    throw new Error("No deals configured.");
  }

  // QA checklist (local time):
  // - Sept 19 → upcoming
  // - Sept 20 → active
  // - Oct 31 (end of day) → active
  // - Nov 1 → expired
  const sept19 = new Date(2025, 8, 19, 12, 0, 0, 0);
  const sept20 = new Date(2025, 8, 20, 12, 0, 0, 0);
  const oct31End = new Date(2025, 9, 31, 23, 59, 59, 999);
  const nov1 = new Date(2025, 10, 1, 0, 0, 0, 0);

  assertEqual(getDealStatus(deal, sept19), "upcoming", "Sept 19 should be upcoming.");
  assertEqual(getDealStatus(deal, sept20), "active", "Sept 20 should be active.");
  assertEqual(getDealStatus(deal, oct31End), "active", "Oct 31 end-of-day should still be active.");
  assertEqual(getDealStatus(deal, nov1), "expired", "Nov 1 should be expired.");
};

run();

