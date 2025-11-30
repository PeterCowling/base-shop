/**
 * Shared DOM/runtime polyfills for the Jest environment.
 *
 * Focused on browser-like APIs that JSDOM/Node may lack:
 * - TextEncoder/TextDecoder
 * - global crypto
 * - File (Node 20+)
 * - URL.createObjectURL / URL.revokeObjectURL
 * - Element.prototype.scrollIntoView
 * - HTMLElement pointer capture methods
 */

import { TextDecoder, TextEncoder } from "node:util";
import { File as NodeFile } from "node:buffer";
import { webcrypto } from "node:crypto";

type DomCompatGlobal = typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
  File?: typeof File;
  crypto?: Crypto;
  ResizeObserver?: typeof ResizeObserver;
  BroadcastChannel?: typeof BroadcastChannel;
  MessageEvent?: typeof MessageEvent;
};

const domGlobal = globalThis as DomCompatGlobal;

// WHATWG encoders/decoders used by various libs
domGlobal.TextEncoder ||= TextEncoder;
domGlobal.TextDecoder ||= TextDecoder;

// Basic File and crypto availability
domGlobal.File ||= NodeFile as unknown as typeof File;
domGlobal.crypto ||= webcrypto as unknown as Crypto;

// JSDOM doesn't implement object URLs; provide minimal stubs used in tests
type UrlWithObjectURL = typeof URL & {
  createObjectURL?: (input: unknown) => string;
  revokeObjectURL?: (url: string) => void;
};

const urlGlobal = URL as UrlWithObjectURL;

if (!urlGlobal.createObjectURL) {
  urlGlobal.createObjectURL = () => "blob:mock";
}
if (!urlGlobal.revokeObjectURL) {
  urlGlobal.revokeObjectURL = () => {};
}

// Missing DOM APIs used by Radix UI & others
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (
  typeof HTMLElement !== "undefined" &&
  !(HTMLElement.prototype as HTMLElement & {
    hasPointerCapture?: (pointerId: number) => boolean;
  }).hasPointerCapture
) {
  const htmlProto = HTMLElement.prototype as HTMLElement & {
    hasPointerCapture?: (pointerId: number) => boolean;
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
  htmlProto.hasPointerCapture = () => false;
  htmlProto.setPointerCapture = () => {};
  htmlProto.releasePointerCapture = () => {};
}

// Minimal ResizeObserver stub for JSDOM tests (measurements not needed for logic assertions)
if (!domGlobal.ResizeObserver) {
  type ResizeObserverCallbackFn = (
    entries: ReadonlyArray<ResizeObserverEntry>,
    observer: ResizeObserver,
  ) => void;

  class ResizeObserverStub {
    constructor(_cb: ResizeObserverCallbackFn) {
      // callback is intentionally ignored; measurements aren't needed for tests
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  domGlobal.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Minimal BroadcastChannel polyfill for jsdom environment.
// MSW v2 references BroadcastChannel for worker coordination, which jsdom lacks.
// A no-op stub is sufficient for unit tests that don't depend on cross-context comms.
if (!domGlobal.BroadcastChannel) {
  class BroadcastChannelMock implements BroadcastChannel {
    name: string;
    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => void) | null = null;
    onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_message: unknown): void {
      // no-op
    }
    close(): void {}
    // Basic event methods for compatibility
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject,
    ): void {
      // no-op
    }
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject,
    ): void {
      // no-op
    }
    dispatchEvent(_event: Event): boolean {
      return false;
    }
  }
  domGlobal.BroadcastChannel = BroadcastChannelMock as unknown as typeof BroadcastChannel;
}

// Minimal MessageEvent polyfill for environments where it's missing (Node + jsdom).
// MSW's WebSocket interceptor references MessageEvent directly when running under Jest.
if (!domGlobal.MessageEvent) {
  class MessageEventMock<T = unknown> {
    type: string;
    data: T;
    origin: string;
    lastEventId: string;
    source: MessageEventSource | null;
    ports: MessagePort[];

    constructor(type: string, eventInitDict: MessageEventInit<T> = {}) {
      this.type = type;
      this.data = eventInitDict.data as T;
      this.origin = eventInitDict.origin ?? "";
      this.lastEventId = eventInitDict.lastEventId ?? "";
      this.source = eventInitDict.source ?? null;
      this.ports = (eventInitDict.ports as MessagePort[]) ?? [];
    }
  }
  domGlobal.MessageEvent = MessageEventMock as unknown as typeof MessageEvent;
}
