export interface SendEvent {
  shop: string;
  campaign: string;
  to?: string;
}

export interface OpenEvent {
  shop: string;
  campaign: string;
}

export interface ClickEvent {
  shop: string;
  campaign: string;
  url: string;
}

type Listener<T> = (event: T) => void | Promise<void>;

const sendListeners: Listener<SendEvent>[] = [];
const openListeners: Listener<OpenEvent>[] = [];
const clickListeners: Listener<ClickEvent>[] = [];

export function onSend(listener: Listener<SendEvent>): void {
  sendListeners.push(listener);
}
export function onOpen(listener: Listener<OpenEvent>): void {
  openListeners.push(listener);
}
export function onClick(listener: Listener<ClickEvent>): void {
  clickListeners.push(listener);
}

export async function emitSend(event: SendEvent): Promise<void> {
  await Promise.all(sendListeners.map((l) => l(event)));
}
export async function emitOpen(event: OpenEvent): Promise<void> {
  await Promise.all(openListeners.map((l) => l(event)));
}
export async function emitClick(event: ClickEvent): Promise<void> {
  await Promise.all(clickListeners.map((l) => l(event)));
}
