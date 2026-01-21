import { promises as fs } from "fs";
import path from "path";

import { validateShopName } from "@acme/lib";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";

import { escapeHtml } from "./escapeHtml";
import { sendCampaignEmail } from "./send";

const DEFAULT_DELAY_MS = 1000 * 60 * 60 * 24;

function envKey(shop: string): string {
  return `ABANDONED_CART_DELAY_MS_${shop
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")}`;
}

/** Resolve reminder delay for a shop (default: one day). */
export async function resolveAbandonedCartDelay(
  shop: string,
  dataRoot: string = DATA_ROOT,
): Promise<number> {
  let delay = DEFAULT_DELAY_MS;

  try {
    const file = path.join(dataRoot, validateShopName(shop), "settings.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is restricted to DATA_ROOT/<validated shop>/settings.json [EMAIL-1000]
    const json = JSON.parse(await fs.readFile(file, "utf8"));
    const cfg = json.abandonedCart?.delayMs ?? json.abandonedCartDelayMs;
    if (typeof cfg === "number") delay = cfg;
  } catch {}

  const envDelay = process.env[envKey(shop)];
  if (envDelay !== undefined) {
    const num = Number(envDelay);
    if (!Number.isNaN(num)) return num;
  }

  const globalEnv = process.env.ABANDONED_CART_DELAY_MS;
  if (globalEnv !== undefined) {
    const num = Number(globalEnv);
    if (!Number.isNaN(num)) return num;
  }

  return delay;
}

export interface AbandonedCart {
  /** Customer's email address */
  email: string;
  /** Arbitrary cart payload */
  cart: unknown;
  /** Last time the cart was updated */
  updatedAt: number;
  /** Whether a reminder email has already been sent */
  reminded?: boolean;
}

function buildCartHtml(cart: unknown): string {
  const cartWithItems = cart as { items?: unknown[] };
  const items = Array.isArray(cartWithItems.items) ? cartWithItems.items : [];
  if (items.length === 0)
    return "<p>You left items in your cart.</p>"; // i18n-exempt -- DS-1234 default fallback copy for email content
  const list = items
    .map((item) => {
      const obj = item as { name?: unknown; title?: unknown };
      const name =
        typeof item === "object" && item !== null
          ? obj.name ?? obj.title ?? String(item)
          : String(item);
      return `<li>${escapeHtml(String(name))}</li>`;
    })
    .join("");
  return `<p>You left items in your cart:</p><ul>${list}</ul>`; // i18n-exempt -- DS-1234 default fallback copy for email content
}

/**
 * Send reminder emails for carts that have been inactive for at least a given delay.
 * Carts with `reminded` set to true are ignored. When an email is sent, the
 * record's `reminded` flag is set to true. Any failures are ignored and
 * returned for optional retries or logging.
 */
export async function recoverAbandonedCarts(
  carts: AbandonedCart[],
  now: number = Date.now(),
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<AbandonedCart[]> {
  const failed: AbandonedCart[] = [];

  for (const record of carts) {
    if (record.reminded) continue;
    if (now - record.updatedAt < delayMs) continue;

    try {
      await sendCampaignEmail({
        to: record.email,
        subject: "You left items in your cart", // i18n-exempt -- DS-1234 default subject for abandoned cart
        html: buildCartHtml(record.cart),
      });
      record.reminded = true;
    } catch {
      failed.push(record);
    }
  }

  return failed;
}
