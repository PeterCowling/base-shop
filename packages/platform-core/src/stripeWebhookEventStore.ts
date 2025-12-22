import type Stripe from "stripe";
import { prisma } from "./db";

type StripeWebhookEventStatus = "processed" | "failed";

const RETENTION_DAYS = 30;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastCleanupAtMs = 0;

function toErrorMessage(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return undefined;
}

function retentionCutoff(now: Date): Date {
  const cutoffMs = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return new Date(cutoffMs);
}

async function cleanupOldRows(now: Date): Promise<void> {
  const nowMs = now.getTime();
  if (nowMs - lastCleanupAtMs < CLEANUP_INTERVAL_MS) return;
  lastCleanupAtMs = nowMs;
  await prisma.stripeWebhookEvent.deleteMany({
    where: { createdAt: { lt: retentionCutoff(now) } },
  });
}

export async function wasStripeWebhookEventProcessed(
  eventId: string,
): Promise<boolean> {
  const row = await prisma.stripeWebhookEvent.findUnique({
    where: { id: eventId },
  });
  return row?.status === "processed";
}

export async function markStripeWebhookEventProcessed(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  await cleanupOldRows(new Date());
  await prisma.stripeWebhookEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      shop,
      type: event.type,
      status: "processed" satisfies StripeWebhookEventStatus,
    },
    update: {
      shop,
      type: event.type,
      status: "processed" satisfies StripeWebhookEventStatus,
      lastError: null,
    },
  });
}

export async function markStripeWebhookEventFailed(
  shop: string,
  event: Stripe.Event,
  err: unknown,
): Promise<void> {
  await cleanupOldRows(new Date());
  await prisma.stripeWebhookEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      shop,
      type: event.type,
      status: "failed" satisfies StripeWebhookEventStatus,
      lastError: toErrorMessage(err),
    },
    update: {
      shop,
      type: event.type,
      status: "failed" satisfies StripeWebhookEventStatus,
      lastError: toErrorMessage(err),
    },
  });
}

