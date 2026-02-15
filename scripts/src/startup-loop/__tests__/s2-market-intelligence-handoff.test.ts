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
      [
        "month,net_booking_value,method,notes",
        "2024-11,100,observed,ok",
        "2024-12,200,observed,ok",
        "2025-01,300,observed,ok",
        "2025-11,110,observed,ok",
        "2025-12,210,observed,ok",
        "2026-01,310,observed,ok",
        "2026-02,50,observed,partial",
        "",
      ].join("\n"),
    );

    await writeFile(
      path.join(repoRoot, "docs/business-os/strategy/TEST/data/bookings_by_month.csv"),
      [
        "month,bookings_count,gross_booking_value,channel_source,notes",
        "2024-11,10,100,Direct:2; OTA:8,ok",
        "2024-12,20,200,Direct:4; OTA:16,ok",
        "2025-01,30,300,Direct:6; OTA:24,ok",
        "2025-11,11,110,Direct:3; OTA:8,ok",
        "2025-12,21,210,Direct:5; OTA:16,ok",
        "2026-01,31,310,Direct:7; OTA:24,ok",
        "2026-02,5,50,Direct:1; OTA:4,partial",
        "",
      ].join("\n"),
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
    expect(promptContent).toContain("Trailing 3 complete months (2025-11..2026-01): net value 630.00; bookings 63; direct share 23.8%; net per booking 10.00.");
    expect(promptContent).toContain("YoY vs same 3-month window: net value 5.0%; bookings 5.0%; direct share delta 3.8pp.");
    expect(promptContent).toContain("prior bullet 1");
    expect(promptContent).toContain("prior bullet 2");
    expect(promptContent).toContain("Total rooms: 2");
  });
});
