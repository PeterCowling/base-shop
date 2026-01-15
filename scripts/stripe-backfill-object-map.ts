// scripts/stripe-backfill-object-map.ts

import { prisma } from "@platform-core/db";
import { upsertStripeObjectShopMap } from "@platform-core/stripeObjectShopMap";
import { validateShopId } from "@platform-core/shopContext";

type Options = {
  livemode: boolean;
  dryRun: boolean;
  shopId?: string;
  limit?: number;
  pageSize: number;
  cursor?: string;
};

function parseBoolean(value: string | undefined): boolean | null {
  if (value == null) return null;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

function parseArgs(argv: string[]): Options {
  const opts: Partial<Options> = { dryRun: false, pageSize: 500 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--livemode") {
      const parsed = parseBoolean(argv[i + 1]);
      if (parsed == null) {
        throw new Error("Expected --livemode true|false");
      }
      opts.livemode = parsed;
      i += 1;
      continue;
    }
    if (arg === "--mode") {
      const mode = argv[i + 1];
      if (mode !== "live" && mode !== "test") {
        throw new Error("Expected --mode live|test");
      }
      opts.livemode = mode === "live";
      i += 1;
      continue;
    }
    if (arg === "--shop") {
      const shop = argv[i + 1];
      if (!shop) throw new Error("Expected --shop <shopId>");
      opts.shopId = validateShopId(shop);
      i += 1;
      continue;
    }
    if (arg === "--limit") {
      const raw = argv[i + 1];
      const n = raw ? Number(raw) : NaN;
      if (!Number.isFinite(n) || n <= 0) throw new Error("Expected --limit <number>");
      opts.limit = Math.floor(n);
      i += 1;
      continue;
    }
    if (arg === "--page-size") {
      const raw = argv[i + 1];
      const n = raw ? Number(raw) : NaN;
      if (!Number.isFinite(n) || n <= 0) throw new Error("Expected --page-size <number>");
      opts.pageSize = Math.min(5000, Math.max(1, Math.floor(n)));
      i += 1;
      continue;
    }
    if (arg === "--cursor") {
      const raw = argv[i + 1];
      if (!raw) throw new Error("Expected --cursor <rentalOrderId>");
      opts.cursor = raw;
      i += 1;
      continue;
    }
    throw new Error(`Unknown arg: ${arg}`);
  }

  if (typeof opts.livemode !== "boolean") {
    throw new Error("Missing required flag: --livemode true|false (or --mode live|test)");
  }

  return opts as Options;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to run the backfill");
  }

  const where = opts.shopId ? { shop: opts.shopId } : undefined;

  let processed = 0;
  let mapped = 0;
  let failed = 0;
  let cursor = opts.cursor;

  while (true) {
    const remaining = typeof opts.limit === "number" ? Math.max(0, opts.limit - processed) : null;
    if (remaining === 0) break;

    const take = remaining == null ? opts.pageSize : Math.min(opts.pageSize, remaining);
    const rows = (await prisma.rentalOrder.findMany({
      where,
      select: {
        id: true,
        shop: true,
        sessionId: true,
        stripePaymentIntentId: true,
        stripeChargeId: true,
      },
      orderBy: { id: "asc" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })) as Array<{
      id?: unknown;
      shop?: unknown;
      sessionId?: unknown;
      stripePaymentIntentId?: unknown;
      stripeChargeId?: unknown;
    }>;

    if (!rows.length) break;
    for (const row of rows) {
      processed += 1;
      if (!isNonEmptyString(row.shop)) continue;
      const shopId = validateShopId(row.shop);

      const candidates: Array<{ objectType: "checkout.session" | "payment_intent" | "charge"; stripeId: string }> = [];
      if (isNonEmptyString(row.sessionId)) {
        candidates.push({ objectType: "checkout.session", stripeId: row.sessionId });
      }
      if (isNonEmptyString(row.stripePaymentIntentId)) {
        candidates.push({ objectType: "payment_intent", stripeId: row.stripePaymentIntentId });
      }
      if (isNonEmptyString(row.stripeChargeId)) {
        candidates.push({ objectType: "charge", stripeId: row.stripeChargeId });
      }

      for (const candidate of candidates) {
        if (opts.dryRun) {
          mapped += 1;
          continue;
        }
        try {
          await upsertStripeObjectShopMap({
            livemode: opts.livemode,
            objectType: candidate.objectType,
            stripeId: candidate.stripeId,
            shopId,
          });
          mapped += 1;
        } catch (err) {
          failed += 1;
          console.error("Failed to upsert Stripe mapping", {
            err,
            livemode: opts.livemode,
            objectType: candidate.objectType,
            stripeId: candidate.stripeId,
            shopId,
            rentalOrderId: row.id,
          });
        }
      }

      const id = isNonEmptyString(row.id) ? row.id : null;
      if (id) cursor = id;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        livemode: opts.livemode,
        shopId: opts.shopId ?? null,
        processedOrders: processed,
        mappedObjects: mapped,
        failedObjects: failed,
        dryRun: opts.dryRun,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && process.argv[1].endsWith("stripe-backfill-object-map.ts")) {
  main()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      const maybeDisconnect = (prisma as { $disconnect?: unknown }).$disconnect;
      if (typeof maybeDisconnect === "function") {
        await (maybeDisconnect as () => Promise<void>)();
      }
    });
}
