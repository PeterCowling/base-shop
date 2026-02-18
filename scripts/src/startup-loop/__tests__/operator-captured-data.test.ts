/** @jest-environment node */

import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { buildOperatorCapturedDataBlock, csvLooksEmptyOrHeaderOnly } from "../s2-market-intelligence-handoff";

async function writeFile(absolutePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf-8");
}

describe("operator-captured-data", () => {
  describe("buildOperatorCapturedDataBlock", () => {
    it("TC-01: embeds all three operator CSVs when present", async () => {
      const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "operator-capture-all-"));
      const dataDir = path.join(repoRoot, "docs/business-os/market-research/TEST/data");

      await writeFile(
        path.join(dataDir, "2026-02-15-parity-scenarios.csv"),
        [
          "scenario,surface,check_in,check_out,travellers,total_price_all_in,currency,taxes_fees_clarity,cancellation_cutoff,deposit_payment,notes",
          "S1,Direct,2026-07-17,2026-07-19,1,150.00,EUR,includes_taxes,free until 24h,,capture_mode=auto; source=octorate",
          "S2,Booking.com,2026-05-12,2026-05-14,1,120.00,EUR,includes_taxes,non-refundable,,capture_mode=auto; source=booking",
        ].join("\n"),
      );

      await writeFile(
        path.join(dataDir, "2026-02-15-bookings-by-channel.csv"),
        [
          "month,channel,bookings,gross_value,currency,notes",
          "2025-02,Direct,10,1000.00,EUR,month_by=check_in",
          "2025-02,Booking.com,20,2000.00,EUR,month_by=check_in",
        ].join("\n"),
      );

      await writeFile(
        path.join(dataDir, "2026-02-15-commission-by-channel.csv"),
        [
          "month,channel,commission_amount,currency,effective_take_rate,notes",
          "2025-02,Direct,0.00,EUR,0.0000,rate=0; rate_source=n/a_direct",
          "2025-02,Booking.com,300.00,EUR,0.1500,rate=0.15; rate_source=commission-rates.json",
        ].join("\n"),
      );

      const block = await buildOperatorCapturedDataBlock({
        repoRoot,
        business: "TEST",
        asOfDate: "2026-02-15",
      });

      expect(block).toContain("# Parity scenarios (S1-S3)");
      expect(block).toContain("# Bookings by channel");
      expect(block).toContain("# Commission / take rate by channel");
      expect(block).toContain("Source: docs/business-os/market-research/TEST/data/2026-02-15-parity-scenarios.csv");
      expect(block).toContain("Source: docs/business-os/market-research/TEST/data/2026-02-15-bookings-by-channel.csv");
      expect(block).toContain("Source: docs/business-os/market-research/TEST/data/2026-02-15-commission-by-channel.csv");
    });

    it("TC-02: embeds non-empty fixtures without warnings", async () => {
      const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "operator-capture-nonempty-"));
      const dataDir = path.join(repoRoot, "docs/business-os/market-research/TEST/data");

      await writeFile(
        path.join(dataDir, "2026-02-15-parity-scenarios.csv"),
        [
          "scenario,surface,check_in,check_out,travellers,total_price_all_in,currency,taxes_fees_clarity,cancellation_cutoff,deposit_payment,notes",
          "S1,Direct,2026-07-17,2026-07-19,1,150.00,EUR,includes_taxes,free until 24h,,capture_mode=auto; source=octorate",
        ].join("\n"),
      );

      const block = await buildOperatorCapturedDataBlock({
        repoRoot,
        business: "TEST",
        asOfDate: "2026-02-15",
      });

      expect(block).toContain("# Parity scenarios (S1-S3)");
      expect(block).not.toContain("present-but-empty");
      expect(block).toContain("S1,Direct,2026-07-17");
    });

    it("TC-03: handles header-only CSVs with warning", async () => {
      const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "operator-capture-header-only-"));
      const dataDir = path.join(repoRoot, "docs/business-os/market-research/TEST/data");

      await writeFile(
        path.join(dataDir, "2026-02-15-parity-scenarios.csv"),
        "scenario,surface,check_in,check_out,travellers,total_price_all_in,currency,taxes_fees_clarity,cancellation_cutoff,deposit_payment,notes\n",
      );

      const block = await buildOperatorCapturedDataBlock({
        repoRoot,
        business: "TEST",
        asOfDate: "2026-02-15",
      });

      expect(block).toContain("# Parity scenarios (S1-S3)");
      expect(block).toContain("Status: present-but-empty (operator must fill)");
    });

    it("TC-04: handles unavailable rows (non-empty but placeholder data)", async () => {
      const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "operator-capture-unavailable-"));
      const dataDir = path.join(repoRoot, "docs/business-os/market-research/TEST/data");

      await writeFile(
        path.join(dataDir, "2026-02-15-parity-scenarios.csv"),
        [
          "scenario,surface,check_in,check_out,travellers,total_price_all_in,currency,taxes_fees_clarity,cancellation_cutoff,deposit_payment,notes",
          "S1,Direct,2026-07-17,2026-07-19,1,unavailable,EUR,unknown,,,capture_mode=auto; source=octorate; failure_reason=Price element not found",
          "S2,Booking.com,2026-05-12,2026-05-14,1,unavailable,EUR,unknown,,,capture_mode=auto; source=booking; failure_reason=Bot detection",
        ].join("\n"),
      );

      const block = await buildOperatorCapturedDataBlock({
        repoRoot,
        business: "TEST",
        asOfDate: "2026-02-15",
      });

      expect(block).toContain("# Parity scenarios (S1-S3)");
      expect(block).not.toContain("present-but-empty");
      expect(block).toContain("unavailable");
      expect(block).toContain("failure_reason=Price element not found");
      expect(block).toContain("failure_reason=Bot detection");
    });

    it("TC-05: returns 'None.' when no CSVs are present", async () => {
      const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "operator-capture-none-"));
      // Don't create any CSV files

      const block = await buildOperatorCapturedDataBlock({
        repoRoot,
        business: "TEST",
        asOfDate: "2026-02-15",
      });

      expect(block).toBe("None.");
    });
  });

  describe("csvLooksEmptyOrHeaderOnly", () => {
    it("recognizes header-only CSV", () => {
      expect(csvLooksEmptyOrHeaderOnly("scenario,surface,check_in\n")).toBe(true);
    });

    it("recognizes empty CSV", () => {
      expect(csvLooksEmptyOrHeaderOnly("")).toBe(true);
      expect(csvLooksEmptyOrHeaderOnly("\n\n")).toBe(true);
    });

    it("recognizes non-empty CSV with data rows", () => {
      expect(csvLooksEmptyOrHeaderOnly("scenario,surface,check_in\nS1,Direct,2026-07-17\n")).toBe(false);
    });

    it("handles CSV with whitespace-only lines", () => {
      expect(csvLooksEmptyOrHeaderOnly("scenario,surface,check_in\n  \n  \n")).toBe(true);
    });
  });
});
