// scripts/src/stripe-object-shop-map.ts

import { prisma } from "@platform-core/db";
import type { StripeObjectType } from "@platform-core/stripeObjectShopMapStore";
import {
  resolveStripeEnvironmentLabel,
  upsertStripeObjectShopMap,
} from "@platform-core/stripeObjectShopMapStore";
import { validateShopName } from "@platform-core/shops";

type Command = "backfill-from-orders" | "associate";

type Args = {
  command: Command;
  environment?: string;
  dryRun: boolean;
  shop?: string;
  batchSize: number;
  limit?: number;
  objectType?: StripeObjectType;
  stripeId?: string;
  shopId?: string;
  actor?: string;
  reason?: string;
};

function parseArgs(argv: string[]): Args {
  const command = (argv[0] ?? "backfill-from-orders") as Command;
  const args: Args = {
    command,
    dryRun: false,
    batchSize: 500,
  };

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--environment" && argv[i + 1]) {
      args.environment = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--environment=")) {
      args.environment = arg.slice("--environment=".length);
      continue;
    }

    if (arg === "--shop" && argv[i + 1]) {
      args.shop = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--shop=")) {
      args.shop = arg.slice("--shop=".length);
      continue;
    }

    if (arg === "--batch-size" && argv[i + 1]) {
      args.batchSize = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--batch-size=")) {
      args.batchSize = Number(arg.slice("--batch-size=".length));
      continue;
    }

    if (arg === "--limit" && argv[i + 1]) {
      args.limit = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      args.limit = Number(arg.slice("--limit=".length));
      continue;
    }

    if (arg === "--object-type" && argv[i + 1]) {
      args.objectType = argv[i + 1] as StripeObjectType;
      i += 1;
      continue;
    }
    if (arg.startsWith("--object-type=")) {
      args.objectType = arg.slice("--object-type=".length) as StripeObjectType;
      continue;
    }

    if (arg === "--stripe-id" && argv[i + 1]) {
      args.stripeId = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--stripe-id=")) {
      args.stripeId = arg.slice("--stripe-id=".length);
      continue;
    }

    if (arg === "--shop-id" && argv[i + 1]) {
      args.shopId = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--shop-id=")) {
      args.shopId = arg.slice("--shop-id=".length);
      continue;
    }

    if (arg === "--actor" && argv[i + 1]) {
      args.actor = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--actor=")) {
      args.actor = arg.slice("--actor=".length);
      continue;
    }

    if (arg === "--reason" && argv[i + 1]) {
      args.reason = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--reason=")) {
      args.reason = arg.slice("--reason=".length);
      continue;
    }
  }

  return args;
}

function isStripeId(prefix: string, value: string | null | undefined): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return Boolean(trimmed) && trimmed.startsWith(prefix);
}

async function backfillFromOrders(args: Args): Promise<void> {
  if (!Number.isFinite(args.batchSize) || args.batchSize <= 0) {
    throw new Error("Invalid --batch-size"); // i18n-exempt -- internal CLI error
  }

  const envLabel = resolveStripeEnvironmentLabel(args.environment);
  const safeShop = args.shop ? validateShopName(args.shop) : undefined;

  let cursor: string | undefined;
  let ordersProcessed = 0;
  let mappingsFound = 0;

  while (true) {
    const rows = await prisma.rentalOrder.findMany({
      select: {
        id: true,
        shop: true,
        sessionId: true,
        stripePaymentIntentId: true,
        stripeChargeId: true,
      },
      ...(safeShop ? { where: { shop: safeShop } } : {}),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      take: args.batchSize,
    });

    if (!rows.length) break;
    cursor = rows[rows.length - 1]?.id;

    for (const row of rows) {
      if (typeof args.limit === "number" && ordersProcessed >= args.limit) {
        return;
      }

      ordersProcessed += 1;

      const shopId = validateShopName(row.shop);
      const mappings: Array<{ objectType: StripeObjectType; stripeId: string }> = [];

      if (isStripeId("cs_", row.sessionId)) {
        mappings.push({ objectType: "checkout_session", stripeId: row.sessionId.trim() });
      }
      if (isStripeId("pi_", row.stripePaymentIntentId)) {
        mappings.push({
          objectType: "payment_intent",
          stripeId: row.stripePaymentIntentId.trim(),
        });
      }
      if (isStripeId("ch_", row.stripeChargeId)) {
        mappings.push({ objectType: "charge", stripeId: row.stripeChargeId.trim() });
      }

      mappingsFound += mappings.length;
      if (args.dryRun) continue;

      for (const mapping of mappings) {
        await upsertStripeObjectShopMap({
          environment: envLabel,
          objectType: mapping.objectType,
          stripeId: mapping.stripeId,
          shopId,
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        event: "stripe_object_shop_map_backfill_complete",
        environment: envLabel,
        shop: safeShop ?? null,
        ordersProcessed,
        mappingsFound,
        dryRun: args.dryRun,
      },
      null,
      2,
    ),
  ); // i18n-exempt -- CLI output
}

async function associateObject(args: Args): Promise<void> {
  const envLabel = resolveStripeEnvironmentLabel(args.environment);
  const objectType = args.objectType;
  const stripeId = args.stripeId?.trim();
  const shopId = args.shopId ? validateShopName(args.shopId) : undefined;
  const actor = args.actor?.trim();
  const reason = args.reason?.trim();

  if (!objectType) throw new Error("Missing --object-type"); // i18n-exempt -- internal CLI error
  if (!stripeId) throw new Error("Missing --stripe-id"); // i18n-exempt -- internal CLI error
  if (!shopId) throw new Error("Missing --shop-id"); // i18n-exempt -- internal CLI error
  if (!actor) throw new Error("Missing --actor"); // i18n-exempt -- internal CLI error
  if (!reason) throw new Error("Missing --reason"); // i18n-exempt -- internal CLI error

  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          event: "stripe_object_shop_map_associate_dry_run",
          environment: envLabel,
          objectType,
          stripeId,
          shopId,
          actor,
          reason,
        },
        null,
        2,
      ),
    ); // i18n-exempt -- CLI output
    return;
  }

  await upsertStripeObjectShopMap({
    environment: envLabel,
    objectType,
    stripeId,
    shopId,
  });

  await prisma.stripeObjectShopMapAudit.create({
    data: {
      environment: envLabel,
      objectType,
      stripeId,
      shopId,
      actor,
      reason,
    },
  });

  console.log(
    JSON.stringify(
      {
        event: "stripe_object_shop_map_associated",
        environment: envLabel,
        objectType,
        stripeId,
        shopId,
      },
      null,
      2,
    ),
  ); // i18n-exempt -- CLI output
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required"); // i18n-exempt -- internal CLI error
  }

  if (args.command === "associate") {
    await associateObject(args);
    return;
  }

  await backfillFromOrders(args);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

