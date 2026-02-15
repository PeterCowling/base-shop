import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { buildS2MarketIntelligenceHandoff } from "../s2-market-intelligence-handoff";

async function writeFile(absolutePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf-8");
}

describe("s2-market-intelligence-handoff", () => {
  it("generates a deep-research prompt with latest internal baselines embedded and delta summaries", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "s2-handoff-test-"));

    await writeFile(
      path.join(repoRoot, "docs/business-os/startup-baselines/TEST-intake-packet.user.md"),
      `---
Type: Startup-Intake-Packet
Status: Active
Business: TEST
Created: 2026-02-12
Updated: 2026-02-12
Owner: Test
---

# TEST Intake Packet

## B) Business and Product Packet

| Field | Value | Tag |
|---|---|---|
| Business code | TEST | observed |
| Business name | TestCo | observed |
| Core offer | Bookings | observed |
| Launch-surface mode | website-live | inferred |

## C) ICP and Channel Packet

| Field | Value | Tag |
|---|---|---|
| Primary ICP (current) | Travelers | inferred |
| Planned channels | Search + direct | observed |

## A) Intake Summary

- Business idea: test business.
`,
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/plan.user.md"),
      `---
Type: Business-Plan
Status: Active
Business: TEST
Created: 2026-02-09
Updated: 2026-02-14
Owner: Test
---

# TEST Plan

## Risks

- Measurement incomplete.
`,
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/2026-02-14-startup-loop-90-day-forecast-v1.user.md"),
      `---
Type: Startup-Loop-Forecast
Status: Active
Business: TEST
Region: Europe (primary: Italy)
Date: 2026-02-14
Owner: Test
---

# Forecast
`,
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/2026-02-13-measurement-verification.user.md"),
      `---
Type: Measurement-Verification
Status: Active
Business: TEST
Date: 2026-02-13
Owner: Test
---

# Measurement

- sessions: **73**
- users: **53**
- conversions: **0**
- eventCount: **563**
- page_view: **258**
- user_engagement: **145**
- begin_checkout: **0**
- web_vitals: **0**
`,
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/data/net_value_by_month.csv"),
      (() => {
        const rows: string[] = ["month,net_booking_value,method,notes"];
        const months: string[] = [];
        for (let year = 2024; year <= 2026; year += 1) {
          for (let month = 1; month <= 12; month += 1) {
            const yyyymm = `${year}-${String(month).padStart(2, "0")}`;
            if (yyyymm < "2024-02") continue;
            if (yyyymm > "2026-02") continue;
            months.push(yyyymm);
          }
        }

        for (const month of months) {
          let net = 1000;
          if (month >= "2025-02" && month <= "2026-01") net = 800;
          if (month === "2025-08") net = 500;
          if (month === "2025-12") net = 700;
          if (month === "2025-03") net = 750;
          if (month === "2026-02") net = 50; // partial month, should be excluded from "complete month" slice
          rows.push(`${month},${net},observed,ok`);
        }

        rows.push("");
        return rows.join("\n");
      })(),
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/data/bookings_by_month.csv"),
      (() => {
        const rows: string[] = ["month,bookings_count,gross_booking_value,channel_source,notes"];
        const months: string[] = [];
        for (let year = 2024; year <= 2026; year += 1) {
          for (let month = 1; month <= 12; month += 1) {
            const yyyymm = `${year}-${String(month).padStart(2, "0")}`;
            if (yyyymm < "2024-02") continue;
            if (yyyymm > "2026-02") continue;
            months.push(yyyymm);
          }
        }

        for (const month of months) {
          let bookings = 100;
          let direct = 30;
          let ota = 70;
          if (month >= "2025-02" && month <= "2026-01") {
            bookings = 90;
            direct = 18;
            ota = 72;
          }
          if (month === "2026-02") {
            bookings = 5; // partial month, should be excluded from "complete month" slice
            direct = 1;
            ota = 4;
          }
          const grossValue = bookings * 20;
          rows.push(`${month},${bookings},${grossValue},Direct:${direct}; OTA:${ota},ok`);
        }

        rows.push("");
        return rows.join("\n");
      })(),
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/data/cloudflare_monthly_proxies.csv"),
      [
        "month,visits_or_requests,top_pages_summary,top_geo_summary,device_summary,notes",
        "2025-11,1000,unavailable,unavailable,unavailable,ok",
        "2025-12,2000,unavailable,unavailable,unavailable,ok",
        "2026-01,3000,unavailable,unavailable,unavailable,ok",
        "",
      ].join("\n"),
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/data/data_quality_notes.md"),
      "# Notes\n- Directional only\n",
    );

    await writeFile(
      path.join(repoRoot, "data/octorate/room-inventory.json"),
      JSON.stringify({ rooms: [{ name: "Room 1" }, { name: "Room 2" }] }, null, 2) + "\n",
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/market-research/TEST/2026-02-01-market-intelligence.user.md"),
      `---
Type: Market-Intelligence-Pack
Status: Active
Business: TEST
Created: 2026-02-01
Owner: Test
---

# Pack

## A) Executive Summary

- prior bullet 1
- prior bullet 2

## B) Other

...
`,
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/market-research/TEST/latest.user.md"),
      `---
Type: Market-Intelligence-Pointer
Status: Active
Business: TEST
Updated: 2026-02-01
Owner: Test
Source-Pack: docs/business-os/market-research/TEST/2026-02-01-market-intelligence.user.md
---

# Latest
`,
    );

    const result = await buildS2MarketIntelligenceHandoff({
      repoRoot,
      business: "TEST",
      asOfDate: "2026-02-15",
      owner: "TestOwner",
    });

    expect(result.promptPath).toBe(
      "docs/business-os/market-research/TEST/2026-02-15-deep-research-market-intelligence-prompt.user.md",
    );
    expect(result.targetOutputPath).toBe(
      "docs/business-os/market-research/TEST/2026-02-15-market-intelligence.user.md",
    );

    const promptAbsolute = path.join(repoRoot, result.promptPath);
    const promptContent = await fs.readFile(promptAbsolute, "utf-8");

    expect(promptContent).toContain("Type: Deep-Research-Prompt");
    expect(promptContent).toContain("Target-Output");
    expect(promptContent).toContain("BEGIN_INTERNAL_BASELINES");
    expect(promptContent).toContain("Total rooms: 2");

    // TC-01: nested frontmatter contamination should not appear inside the Deep Research prompt block.
    const promptBlockMatch = promptContent.match(/```text\n([\s\S]*?)\n```/);
    expect(promptBlockMatch).not.toBeNull();
    const promptBlock = promptBlockMatch?.[1] ?? "";
    expect(promptBlock).not.toContain("\n---\n");

    // TC-03: compact slice should include only the last 12 complete months by date.
    // As-of 2026-02-15 => last complete month is 2026-01, so slice should be 2025-02..2026-01.
    expect(promptContent).toContain("YoY window (12 complete months): 2025-02..2026-01 vs 2024-02..2025-01");
    expect(promptContent).toContain("## Monthly Slice (Last 12 Complete Months)");
    expect(promptContent).toContain("| 2025-02 |");
    expect(promptContent).toContain("| 2026-01 |");
    expect(promptContent).not.toContain("| 2026-02 |");

    // TC-02: top decline months should be present and ordered by largest net-value decline.
    expect(promptContent).toContain("## Top YoY Decline Months (By Net Value Delta)");
    const topDeclinesSection = promptContent.match(
      /## Top YoY Decline Months \(By Net Value Delta\)[\s\S]*?(?=\n## |\n$)/,
    )?.[0];
    expect(topDeclinesSection).toContain("| 2025-08 |");
    expect(topDeclinesSection).toContain("| 2025-12 |");
    expect(topDeclinesSection).toContain("| 2025-03 |");
  });
});
