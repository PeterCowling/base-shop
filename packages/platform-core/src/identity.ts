import { randomUUID } from "crypto";

import { stripe } from "@acme/stripe";

import { updateCustomerProfile } from "./customerProfiles";
import { prisma } from "./db";

const DEFAULT_ENVIRONMENT = process.env.NODE_ENV ?? "development";

export type CustomerIdentityInput = {
  issuer: string;
  subject: string;
  email?: string;
  name?: string;
};

export async function getOrCreateCustomerIdentity({
  issuer,
  subject,
  email,
  name,
}: CustomerIdentityInput): Promise<{ internalCustomerId: string }> {
  const existing = await prisma.customerIdentity.findUnique({
    where: {
      issuer_subject: {
        issuer,
        subject,
      },
    },
  });
  if (existing) {
    if (email) {
      const displayName = name ?? email;
      await updateCustomerProfile(existing.internalCustomerId, {
        name: displayName,
        email,
      });
    }
    return { internalCustomerId: existing.internalCustomerId };
  }

  const internalCustomerId = randomUUID();
  try {
    await prisma.customerIdentity.create({
      data: {
        issuer,
        subject,
        internalCustomerId,
      },
    });
  } catch (error) {
    const retry = await prisma.customerIdentity.findUnique({
      where: {
        issuer_subject: {
          issuer,
          subject,
        },
      },
    });
    if (retry) {
      return { internalCustomerId: retry.internalCustomerId };
    }
    throw error;
  }

  if (email) {
    const displayName = name ?? email;
    await updateCustomerProfile(internalCustomerId, {
      name: displayName,
      email,
    });
  }
  return { internalCustomerId };
}

export async function getOrCreateStripeCustomerId(params: {
  internalCustomerId: string;
  email?: string;
  name?: string;
  environment?: string;
}): Promise<string> {
  const environment = params.environment ?? DEFAULT_ENVIRONMENT;
  const existing = await prisma.customerStripeMapping.findUnique({
    where: {
      internalCustomerId_environment: {
        internalCustomerId: params.internalCustomerId,
        environment,
      },
    },
  });
  if (existing) return existing.stripeCustomerId;

  const idempotencyKey = `customer_${params.internalCustomerId}_${environment}`;
  const customer = await stripe.customers.create(
    {
      email: params.email,
      name: params.name,
      metadata: {
        internal_customer_id: params.internalCustomerId,
      },
    },
    { idempotencyKey },
  );

  try {
    await prisma.customerStripeMapping.create({
      data: {
        internalCustomerId: params.internalCustomerId,
        stripeCustomerId: customer.id,
        environment,
      },
    });
  } catch (error) {
    const retry = await prisma.customerStripeMapping.findUnique({
      where: {
        internalCustomerId_environment: {
          internalCustomerId: params.internalCustomerId,
          environment,
        },
      },
    });
    if (retry) return retry.stripeCustomerId;
    throw error;
  }

  return customer.id;
}
