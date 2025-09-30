// packages/ui/jest.setup.local.ts
// Lightweight shims for browser globals used in shared test utilities.

declare global {
  // eslint-disable-next-line no-var
  var BroadcastChannel: typeof window.BroadcastChannel | undefined;
}

if (typeof globalThis.BroadcastChannel === "undefined") {
  class PolyfillBroadcastChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(data: unknown) {
      // Fire asynchronously to match browser semantics
      setTimeout(() => {
        if (this.onmessage) {
          // Minimal shape for consumers that only read `.data`
          this.onmessage({ data } as MessageEvent);
        }
      }, 0);
    }
    close() {
      this.onmessage = null;
    }
    addEventListener(type: string, listener: (ev: MessageEvent) => void) {
      if (type === "message") this.onmessage = listener;
    }
    removeEventListener(type: string) {
      if (type === "message") this.onmessage = null;
    }
  }

  // Expose on both global and window for jsdom
  // @ts-expect-error jsdom window may be undefined at import time
  globalThis.BroadcastChannel = PolyfillBroadcastChannel as any;
  if (typeof window !== "undefined") {
    // @ts-expect-error assign to readonly in TS lib
    (window as any).BroadcastChannel = PolyfillBroadcastChannel;
  }
}

export {};

