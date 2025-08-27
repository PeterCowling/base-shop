// Polyfill MessageChannel with a minimal implementation that doesn't keep
// Node's event loop alive.  React's scheduler only relies on the asynchronous
// message delivery semantics, so we simulate that with setImmediate and stub
// out the port methods.
class ManagedMessageChannel {
  constructor() {
    this.port2 = {
      onmessage: null,
      addEventListener(type, handler) {
        if (type === "message") {
          this.onmessage = handler;
        }
      },
      removeEventListener() {},
      close() {},
      unref() {},
    };
    this.port1 = {
      postMessage: (data) => {
        setImmediate(() => {
          this.port2.onmessage?.({ data });
        });
      },
      addEventListener() {},
      removeEventListener() {},
      close() {},
      unref() {},
    };
  }
}

global.MessageChannel = ManagedMessageChannel;
