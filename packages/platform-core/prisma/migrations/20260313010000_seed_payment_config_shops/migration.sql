-- Seed initial ShopPaymentConfig rows for known shops.
-- Uses INSERT ... ON CONFLICT DO NOTHING so the migration is idempotent:
-- running it on a database that already has these rows is safe.
--
-- cover-me-pretty: Stripe-only (hardcoded; shop.json billingProvider = "stripe").
-- caryina: Axerve default (matches PAYMENTS_PROVIDER env default).

INSERT INTO "ShopPaymentConfig" ("id", "shopId", "activeProvider", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'cover-me-pretty', 'stripe',  NOW(), NOW()),
  (gen_random_uuid()::text, 'caryina',         'axerve',  NOW(), NOW())
ON CONFLICT ("shopId") DO NOTHING;
