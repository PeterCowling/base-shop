import { trackEvent } from "@platform-core/analytics";

export interface SendEvent {
  campaign: string;
  recipient?: string;
}

export interface OpenEvent {
  campaign: string;
  recipient?: string;
  messageId?: string;
}

export interface ClickEvent {
  campaign: string;
  url?: string;
  recipient?: string;
  messageId?: string;
}

export type SendHook = (shop: string, ev: SendEvent) => Promise<void> | void;
export type OpenHook = (shop: string, ev: OpenEvent) => Promise<void> | void;
export type ClickHook = (shop: string, ev: ClickEvent) => Promise<void> | void;

const sendHooks: SendHook[] = [];
const openHooks: OpenHook[] = [];
const clickHooks: ClickHook[] = [];

export function onSend(h: SendHook): void {
  sendHooks.push(h);
}

export function onOpen(h: OpenHook): void {
  openHooks.push(h);
}

export function onClick(h: ClickHook): void {
  clickHooks.push(h);
}

export async function triggerSend(shop: string, ev: SendEvent): Promise<void> {
  for (const h of sendHooks) {
    await h(shop, ev);
  }
}

export async function triggerOpen(shop: string, ev: OpenEvent): Promise<void> {
  for (const h of openHooks) {
    await h(shop, ev);
  }
}

export async function triggerClick(shop: string, ev: ClickEvent): Promise<void> {
  for (const h of clickHooks) {
    await h(shop, ev);
  }
}

// default analytics listeners
onSend((shop, ev) =>
  trackEvent(shop, { ...ev, type: "email_sent" })
);
onOpen((shop, ev) =>
  trackEvent(shop, { ...ev, type: "email_open" })
);
onClick((shop, ev) =>
  trackEvent(shop, { ...ev, type: "email_click" })
);

