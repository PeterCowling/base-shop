/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import type { GrowthLedger } from "@acme/lib";

import { GrowthLedgerCard } from "./GrowthLedgerCard";

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

function makeLedger(): GrowthLedger {
  return {
    schema_version: 1,
    ledger_revision: 2,
    business: "HEAD",
    period: {
      period_id: "2026-W07",
      start_date: "2026-02-09",
      end_date: "2026-02-15",
      forecast_id: "HEAD-FC-2026Q1",
    },
    threshold_set_id: "gts_ab12cd34ef56",
    threshold_set_hash:
      "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    threshold_locked_at: "2026-02-13T12:00:00.000Z",
    updated_at: "2026-02-13T12:00:00.000Z",
    stages: {
      acquisition: {
        status: "red",
        policy: { blocking_mode: "always" },
        metrics: {},
        reasons: [],
      },
      activation: {
        status: "yellow",
        policy: { blocking_mode: "always" },
        metrics: {},
        reasons: [],
      },
      revenue: {
        status: "green",
        policy: { blocking_mode: "always" },
        metrics: {},
        reasons: [],
      },
      retention: {
        status: "not_tracked",
        policy: { blocking_mode: "after_valid" },
        metrics: {},
        reasons: [],
      },
      referral: {
        status: "not_tracked",
        policy: { blocking_mode: "never" },
        metrics: {},
        reasons: [],
      },
    },
  };
}

describe("GrowthLedgerCard", () => {
  it("TC-01: renders empty state when ledger is missing", () => {
    render(<GrowthLedgerCard businessCode="HEAD" ledger={null} />);

    expect(screen.getByTestId("growth-ledger-card-empty")).toBeInTheDocument();
    expect(screen.getByText("businessOs.growthLedger.title")).toBeInTheDocument();
  });

  it("TC-02: renders stage statuses and computed overall signal for mixed fixture", () => {
    render(<GrowthLedgerCard businessCode="HEAD" ledger={makeLedger()} />);

    expect(screen.getByTestId("growth-ledger-card")).toBeInTheDocument();
    expect(screen.getByTestId("growth-ledger-overall-status")).toHaveTextContent("red");
    expect(screen.getByTestId("growth-ledger-guardrail-signal")).toHaveTextContent("kill");
    expect(screen.getByTestId("growth-stage-acquisition")).toHaveTextContent("red");
    expect(screen.getByTestId("growth-stage-retention")).toHaveTextContent("not_tracked");
  });
});
