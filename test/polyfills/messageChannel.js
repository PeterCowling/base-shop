// Polyfill MessageChannel so React's scheduler doesn't keep Jest alive
// or trigger "open handle" warnings. Instead of relying on Node's
// `worker_threads` MessageChannel—which allocates real MessagePort handles
// that Jest detects as open—emulate the minimal behaviour the scheduler
// requires using `setImmediate`.

class ManagedMessageChannel {
  constructor() {
    const port1 = this._createPort(() => port2);
    const port2 = this._createPort(() => port1);
    this.port1 = port1;
    this.port2 = port2;
  }

  _createPort(getTarget) {
    return {
      onmessage: null,
      postMessage: (msg) => {
        // Deliver the message asynchronously to mimic native semantics.
        setImmediate(() => {
          getTarget().onmessage?.({ data: msg });
        });
      },
      close: () => {},
      ref: () => {},
      unref: () => {},
      start: () => {},
    };
  }
}

// Install the managed implementation globally.
global.MessageChannel = ManagedMessageChannel;

