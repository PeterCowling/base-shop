import { prisma } from "./db";
import { validateShopName } from "./shops";

const DEFAULT_ENVIRONMENT = process.env.NODE_ENV ?? "development";

export type StripeEnvironment = string;

export type StripeObjectType =
  | "checkout_session"
  | "payment_intent"
  | "charge"
  | "subscription"
  | "invoice";

export function resolveStripeEnvironmentLabel(
  environment: string | undefined,
): StripeEnvironment {
  const trimmed = environment?.trim();
  return trimmed ? trimmed : DEFAULT_ENVIRONMENT;
}

export async function upsertStripeObjectShopMap(params: {
  environment?: string;
  objectType: StripeObjectType;
  stripeId: string;
  shopId: string;
}): Promise<void> {
  const stripeId = params.stripeId.trim();
  if (!stripeId) return;

  const shopId = validateShopName(params.shopId);
  const environment = resolveStripeEnvironmentLabel(params.environment);

  await prisma.stripeObjectShopMap.upsert({
    where: {
      environment_objectType_stripeId: {
        environment,
        objectType: params.objectType,
        stripeId,
      },
    },
    create: {
      environment,
      objectType: params.objectType,
      stripeId,
      shopId,
    },
    update: {
      shopId,
    },
  });
}

export async function findShopIdForStripeObject(params: {
  environment?: string;
  objectType: StripeObjectType;
  stripeId: string;
}): Promise<string | null> {
  const stripeId = params.stripeId.trim();
  if (!stripeId) return null;

  const environment = resolveStripeEnvironmentLabel(params.environment);
  const row = await prisma.stripeObjectShopMap.findUnique({
    where: {
      environment_objectType_stripeId: {
        environment,
        objectType: params.objectType,
        stripeId,
      },
    },
  });

  const shopId = (row as { shopId?: unknown } | null)?.shopId;
  return typeof shopId === "string" && shopId ? shopId : null;
}

