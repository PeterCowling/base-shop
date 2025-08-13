import { trackEvent } from "@platform-core/analytics";

export interface SendEvent {
  shop: string;
  campaign: string;
}

export interface OpenEvent {
  shop: string;
  campaign: string;
}

export interface ClickEvent {
  shop: string;
  campaign: string;
  url?: string;
}

type Hook<T> = (event: T) => void | Promise<void>;

const sendHooks: Hook<SendEvent>[] = [];
const openHooks: Hook<OpenEvent>[] = [];
const clickHooks: Hook<ClickEvent>[] = [];

export function onSend(hook: Hook<SendEvent>): void {
  sendHooks.push(hook);
}

export function onOpen(hook: Hook<OpenEvent>): void {
  openHooks.push(hook);
}

export function onClick(hook: Hook<ClickEvent>): void {
  clickHooks.push(hook);
}

export async function emitSend(event: SendEvent): Promise<void> {
  await Promise.all(sendHooks.map((h) => h(event)));
}

export async function emitOpen(event: OpenEvent): Promise<void> {
  await Promise.all(openHooks.map((h) => h(event)));
}

export async function emitClick(event: ClickEvent): Promise<void> {
  await Promise.all(clickHooks.map((h) => h(event)));
}

onSend(({ shop, campaign }) =>
  trackEvent(shop, { type: "email_sent", campaign })
);

onOpen(({ shop, campaign }) =>
  trackEvent(shop, { type: "email_open", campaign })
);

onClick(({ shop, campaign }) =>
  trackEvent(shop, { type: "email_click", campaign })
);

