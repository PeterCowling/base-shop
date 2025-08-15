import type { AnalyticsEvent } from "@acme/types";
export type HookPayload = { campaign: string };

export type HookHandler = (
  shop: string,
  payload: HookPayload
) => void | Promise<void>;

const sendListeners: HookHandler[] = [];
const openListeners: HookHandler[] = [];
const clickListeners: HookHandler[] = [];

export function onSend(listener: HookHandler): void {
  sendListeners.push(listener);
}

export function onOpen(listener: HookHandler): void {
  openListeners.push(listener);
}

export function onClick(listener: HookHandler): void {
  clickListeners.push(listener);
}

export async function emitSend(shop: string, payload: HookPayload): Promise<void> {
  await Promise.all(sendListeners.map((fn) => fn(shop, payload)));
}

export async function emitOpen(shop: string, payload: HookPayload): Promise<void> {
  await Promise.all(openListeners.map((fn) => fn(shop, payload)));
}

export async function emitClick(shop: string, payload: HookPayload): Promise<void> {
  await Promise.all(clickListeners.map((fn) => fn(shop, payload)));
}

async function track(shop: string, data: AnalyticsEvent): Promise<void> {
  const { trackEvent } = await import("@platform-core/analytics");
  await trackEvent(shop, data);
}

// default analytics listeners
onSend((shop, { campaign }) => track(shop, { type: "email_sent", campaign }));
onOpen((shop, { campaign }) => track(shop, { type: "email_open", campaign }));
onClick((shop, { campaign }) => track(shop, { type: "email_click", campaign }));
