// Polyfill MessageChannel with a minimal implementation that doesn't keep
// Node's event loop alive. React's scheduler only relies on the asynchronous
// message delivery semantics, so we simulate that with a single setTimeout and
// stub out the port methods.
class ManagedMessageChannel {
  port1: {
    onmessage: ((event: { data: unknown }) => void) | null;
    addEventListener: (type: string, handler: (e: { data: unknown }) => void) => void;
    removeEventListener: () => void;
    postMessage: () => void;
    close: () => void;
    unref: () => void;
  };
  port2: {
    postMessage: (data: unknown) => void;
    addEventListener: () => void;
    removeEventListener: () => void;
    close: () => void;
    unref: () => void;
  };

  constructor() {
    this.port1 = {
      onmessage: null,
      addEventListener: function (this: any, type: string, handler: (e: { data: unknown }) => void) {
        if (type === "message") {
          this.onmessage = handler;
        }
      },
      removeEventListener: () => {},
      // `postMessage` mirrors the spec, but is a no-op for port1 in this stub.
      postMessage: () => {},
      close: () => {},
      unref: () => {},
    };
    this.port2 = {
      postMessage: (data: unknown) => {
        setTimeout(() => {
          (this.port1.onmessage as any)?.({ data });
        }, 0);
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      close: () => {},
      unref: () => {},
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).MessageChannel = ManagedMessageChannel;

