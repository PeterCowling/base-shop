import type { AnalyticsEvent } from "@acme/types";

export type HookPayload = { campaign: string };

export type HookHandler = (
  shop: string,
  payload: HookPayload
) => void | Promise<void>;

const sendListeners: HookHandler[] = [];
const openListeners: HookHandler[] = [];
const clickListeners: HookHandler[] = [];

/**
 * Register a listener that runs whenever an email is sent.
 *
 * @param listener - Handler invoked with the shop ID and payload.
 *
 * @example
 * ```ts
 * onSend(async (shop, payload) => {
 *   console.log(`Email sent for ${shop}`, payload);
 * });
 * ```
 */
export function onSend(listener: HookHandler): void {
  sendListeners.push(listener);
}

/**
 * Register a listener that runs when an email is opened.
 *
 * @param listener - Handler invoked with the shop ID and payload.
 *
 * @example
 * ```ts
 * onOpen(async (shop, payload) => {
 *   console.log(`Email opened for ${shop}`, payload);
 * });
 * ```
 */
export function onOpen(listener: HookHandler): void {
  openListeners.push(listener);
}

/**
 * Register a listener that runs when a link in an email is clicked.
 *
 * @param listener - Handler invoked with the shop ID and payload.
 *
 * @example
 * ```ts
 * onClick(async (shop, payload) => {
 *   console.log(`Email link clicked for ${shop}`, payload);
 * });
 * ```
 */
export function onClick(listener: HookHandler): void {
  clickListeners.push(listener);
}

/**
 * Trigger all registered send listeners.
 *
 * @param shop - Identifier for the shop.
 * @param payload - Context about the email campaign.
 * @returns A promise that resolves once every listener has completed.
 *
 * @example
 * ```ts
 * await emitSend("my-shop", { campaign: "spring" });
 * ```
 */
export async function emitSend(shop: string, payload: HookPayload): Promise<void> {
  await Promise.all(sendListeners.map((fn) => fn(shop, payload)));
}

/**
 * Trigger all registered open listeners.
 *
 * @param shop - Identifier for the shop.
 * @param payload - Context about the email campaign.
 * @returns A promise that resolves once every listener has completed.
 *
 * @example
 * ```ts
 * await emitOpen("my-shop", { campaign: "spring" });
 * ```
 */
export async function emitOpen(shop: string, payload: HookPayload): Promise<void> {
  await Promise.all(openListeners.map((fn) => fn(shop, payload)));
}

/**
 * Trigger all registered click listeners.
 *
 * @param shop - Identifier for the shop.
 * @param payload - Context about the email campaign.
 * @returns A promise that resolves once every listener has completed.
 *
 * @example
 * ```ts
 * await emitClick("my-shop", { campaign: "spring" });
 * ```
 */
export async function emitClick(shop: string, payload: HookPayload): Promise<void> {
  await Promise.all(clickListeners.map((fn) => fn(shop, payload)));
}

async function track(shop: string, data: AnalyticsEvent): Promise<void> {
  const { trackEvent } = await import("@acme/platform-core/analytics"); // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
  await trackEvent(shop, data);
}

// default analytics listeners
onSend((shop, { campaign }) => track(shop, { type: "email_sent", campaign })); // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
onOpen((shop, { campaign }) => track(shop, { type: "email_open", campaign })); // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
onClick((shop, { campaign }) => track(shop, { type: "email_click", campaign })); // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
