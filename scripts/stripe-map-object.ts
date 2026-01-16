// scripts/stripe-map-object.ts

import {
  forceUpsertStripeObjectShopMap,
  upsertStripeObjectShopMap,
  type StripeObjectType,
} from "@platform-core/stripeObjectShopMap";
import { validateShopId } from "@platform-core/shopContext";

type Options = {
  livemode: boolean;
  objectType: StripeObjectType;
  stripeId: string;
  shopId: string;
  force: boolean;
};

function parseBoolean(value: string | undefined): boolean | null {
  if (value == null) return null;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

function parseObjectType(value: string | undefined): StripeObjectType | null {
  if (!value) return null;
  switch (value) {
    case "checkout.session":
    case "payment_intent":
    case "charge":
    case "invoice":
    case "subscription":
      return value;
    default:
      return null;
  }
}

function parseArgs(argv: string[]): Options {
  const opts: Partial<Options> = { force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;
    if (arg === "--force") {
      opts.force = true;
      continue;
    }
    if (arg === "--livemode") {
      const parsed = parseBoolean(argv[i + 1]);
      if (parsed == null) throw new Error("Expected --livemode true|false");
      opts.livemode = parsed;
      i += 1;
      continue;
    }
    if (arg === "--mode") {
      const mode = argv[i + 1];
      if (mode !== "live" && mode !== "test") throw new Error("Expected --mode live|test");
      opts.livemode = mode === "live";
      i += 1;
      continue;
    }
    if (arg === "--type" || arg === "--object-type") {
      const parsed = parseObjectType(argv[i + 1]);
      if (!parsed) throw new Error("Expected --type <stripe object type>");
      opts.objectType = parsed;
      i += 1;
      continue;
    }
    if (arg === "--id" || arg === "--stripe-id") {
      const id = argv[i + 1];
      if (!id) throw new Error("Expected --id <stripe id>");
      opts.stripeId = id;
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
    throw new Error(`Unknown arg: ${arg}`);
  }

  if (typeof opts.livemode !== "boolean") {
    throw new Error("Missing required flag: --livemode true|false (or --mode live|test)");
  }
  if (!opts.objectType) throw new Error("Missing required flag: --type <stripe object type>");
  if (!opts.stripeId) throw new Error("Missing required flag: --id <stripe id>");
  if (!opts.shopId) throw new Error("Missing required flag: --shop <shopId>");

  return opts as Options;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to write Stripe mappings");
  }

  if (opts.force) {
    await forceUpsertStripeObjectShopMap(opts);
  } else {
    await upsertStripeObjectShopMap(opts);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        livemode: opts.livemode,
        objectType: opts.objectType,
        stripeId: opts.stripeId,
        shopId: opts.shopId,
        force: opts.force,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && process.argv[1].endsWith("stripe-map-object.ts")) {
  // executed via tsx
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
