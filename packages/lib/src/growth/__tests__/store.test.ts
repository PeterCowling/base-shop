import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  GrowthLedgerConflictError,
  growthLedgerPath,
  readGrowthLedger,
  updateGrowthLedger,
  writeGrowthLedger,
} from "../store";
import type { GrowthLedger } from "../types";

const SHOP_ID = "HEAD";

function createLedger(
  revision: number,
  overrides: Partial<GrowthLedger> = {},
): GrowthLedger {
  return {
    schema_version: 1,
    ledger_revision: revision,
    business: SHOP_ID,
    period: {
      period_id: "2026-W07",
      start_date: "2026-02-09",
      end_date: "2026-02-15",
      forecast_id: "HEAD-FC-2026Q1",
    },
    threshold_set_id: "gts_123456789abc",
    threshold_set_hash:
      "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    threshold_locked_at: "2026-02-13T00:00:00.000Z",
    updated_at: "2026-02-13T00:00:00.000Z",
    stages: {
      acquisition: {
        status: "green",
        policy: { blocking_mode: "always" },
        metrics: {
          blended_cac_eur_cents: 1200,
          new_customers_count: 10,
        },
        reasons: [],
      },
      activation: {
        status: "green",
        policy: { blocking_mode: "always" },
        metrics: {
          sitewide_cvr_bps: 140,
          sessions_count: 1000,
        },
        reasons: [],
      },
      revenue: {
        status: "green",
        policy: { blocking_mode: "always" },
        metrics: {
          aov_eur_cents: 3300,
          orders_count: 20,
        },
        reasons: [],
      },
      retention: {
        status: "insufficient_data",
        policy: { blocking_mode: "after_valid" },
        metrics: {
          return_rate_30d_bps: null,
          orders_shipped_count: 20,
        },
        reasons: [],
      },
      referral: {
        status: "not_tracked",
        policy: { blocking_mode: "never" },
        metrics: {
          referral_conversion_rate_bps: null,
          referral_sessions_count: null,
        },
        reasons: [],
      },
    },
    ...overrides,
  };
}

describe("growth store", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "growth-store-"));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  test("TC-01: reading missing ledger returns null", async () => {
    const ledger = await readGrowthLedger(SHOP_ID, { dataRoot: tempRoot });
    expect(ledger).toBeNull();
  });

  test("TC-02: write interruption leaves target file absent and no partial data", async () => {
    const brokenFileOps = {
      mkdir: fs.mkdir.bind(fs),
      readFile: fs.readFile.bind(fs),
      writeFile: fs.writeFile.bind(fs),
      unlink: fs.unlink.bind(fs),
      rename: async () => {
        throw new Error("simulated-rename-failure");
      },
    };

    await expect(
      writeGrowthLedger(SHOP_ID, createLedger(0), {
        dataRoot: tempRoot,
        fileOps: brokenFileOps,
      }),
    ).rejects.toThrow("simulated-rename-failure");

    const targetPath = growthLedgerPath(SHOP_ID, tempRoot);
    await expect(fs.readFile(targetPath, "utf8")).rejects.toHaveProperty(
      "code",
      "ENOENT",
    );

    const files = await fs.readdir(path.dirname(targetPath));
    expect(files.every((name) => !name.includes(".tmp-"))).toBe(true);
  });

  test("TC-03: idempotent update with identical payload does not increment revision", async () => {
    const initial = createLedger(0);
    await writeGrowthLedger(SHOP_ID, initial, { dataRoot: tempRoot });

    const result = await updateGrowthLedger({
      shopId: SHOP_ID,
      expectedRevision: 0,
      options: { dataRoot: tempRoot },
      computeNext: (current) => {
        if (!current) {
          throw new Error("expected current ledger");
        }
        return current;
      },
    });

    expect(result.changed).toBe(false);
    expect(result.ledger.ledger_revision).toBe(0);
  });

  test("TC-04: changed update increments revision exactly once", async () => {
    const initial = createLedger(2);
    await writeGrowthLedger(SHOP_ID, initial, { dataRoot: tempRoot });

    const result = await updateGrowthLedger({
      shopId: SHOP_ID,
      expectedRevision: 2,
      options: { dataRoot: tempRoot },
      computeNext: (current) => {
        if (!current) {
          throw new Error("expected current ledger");
        }
        return {
          ...current,
          // Intentionally stale revision to verify store enforces +1 behavior.
          ledger_revision: 2,
          stages: {
            ...current.stages,
            activation: {
              ...current.stages.activation,
              metrics: {
                ...current.stages.activation.metrics,
                sitewide_cvr_bps: 160,
              },
            },
          },
        };
      },
    });

    expect(result.changed).toBe(true);
    expect(result.ledger.ledger_revision).toBe(3);
  });

  test("TC-05: stale expected revision raises conflict and preserves stored state", async () => {
    const initial = createLedger(5);
    await writeGrowthLedger(SHOP_ID, initial, { dataRoot: tempRoot });

    await expect(
      updateGrowthLedger({
        shopId: SHOP_ID,
        expectedRevision: 4,
        options: { dataRoot: tempRoot },
        computeNext: (current) => {
          if (!current) {
            throw new Error("expected current ledger");
          }
          return {
            ...current,
            ledger_revision: 6,
          };
        },
      }),
    ).rejects.toBeInstanceOf(GrowthLedgerConflictError);

    const persisted = await readGrowthLedger(SHOP_ID, { dataRoot: tempRoot });
    expect(persisted?.ledger_revision).toBe(5);
  });
});

