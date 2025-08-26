// Polyfill MessageChannel so that React's scheduler ports don't keep Jest
// alive or trigger "open handle" warnings.
const { MessageChannel: NodeMessageChannel } = require("node:worker_threads");

// Track MessagePorts so we can close them once the test suite finishes.
const openPorts = [];

class ManagedMessageChannel extends NodeMessageChannel {
  constructor(...args) {
    super(...args);
    openPorts.push(this.port1, this.port2);
    // React never closes these ports, so unref both ends immediately to avoid
    // keeping the Node.js event loop active.  Jest's open-handle detection
    // still sees them as active until explicitly closed, so we collect them
    // for cleanup after the tests complete.
    this.port1.unref();
    this.port2.unref();
  }
}

function closeOpenPorts() {
  for (const port of openPorts.splice(0)) {
    try {
      port.close();
    } catch {}
  }
}

// Replace the global MessageChannel with the managed version.
global.MessageChannel = ManagedMessageChannel;

// Close any remaining ports after all tests and right before process exit.
afterAll(closeOpenPorts);
process.on("exit", closeOpenPorts);
