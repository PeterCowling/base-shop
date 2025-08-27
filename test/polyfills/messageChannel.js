// Polyfill MessageChannel with a minimal implementation that doesn't keep
// Node's event loop alive.  React's scheduler only relies on the asynchronous
// message delivery semantics, so we simulate that with setTimeout and stub
// out the port methods.
class ManagedMessageChannel {
  constructor() {
    this.port1 = {
      onmessage: null,
      postMessage: (data) => {
        setTimeout(() => {
          this.port2.onmessage?.({ data });
        }, 0);
      },
      addEventListener(type, handler) {
        if (type === "message") {
          this.onmessage = handler;
        }
      },
      removeEventListener() {},
      close() {},
      unref() {},
    };
    this.port2 = {
      onmessage: null,
      postMessage: (data) => {
        setTimeout(() => {
          this.port1.onmessage?.({ data });
        }, 0);
      },
      addEventListener(type, handler) {
        if (type === "message") {
          this.onmessage = handler;
        }
      },
      removeEventListener() {},
      close() {},
      unref() {},
    };
  }
}

global.MessageChannel = ManagedMessageChannel;
