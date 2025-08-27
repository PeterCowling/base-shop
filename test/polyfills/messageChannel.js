// Polyfill MessageChannel with a minimal implementation that doesn't keep
// Node's event loop alive.  React's scheduler only relies on the asynchronous
// message delivery semantics, so we simulate that with a single setTimeout and stub
// out the port methods.
class ManagedMessageChannel {
  constructor() {
    this.port1 = {
      onmessage: null,
      addEventListener(type, handler) {
        if (type === "message") {
          this.onmessage = handler;
        }
      },
      removeEventListener() {},
      // `postMessage` is included to mirror the spec, but it is a no-op here.
      postMessage() {},
      close() {},
      unref() {},
    };
    this.port2 = {
      postMessage: (data) => {
        setTimeout(() => {
          this.port1.onmessage?.({ data });
        }, 0);
      },
      addEventListener() {},
      removeEventListener() {},
      close() {},
      unref() {},
    };
  }
}

global.MessageChannel = ManagedMessageChannel;
