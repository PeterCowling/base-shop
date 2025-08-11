// Polyfill to track MessagePorts created by React's scheduler
import { MessageChannel as NodeMessageChannel } from "node:worker_threads";

const openPorts = [];
class ManagedMessageChannel extends NodeMessageChannel {
  constructor(...args) {
    super(...args);
    openPorts.push(this.port1, this.port2);
  }
}

// Replace global MessageChannel with managed version
global.MessageChannel = ManagedMessageChannel;

afterEach(() => {
  for (const port of openPorts.splice(0)) {
    try {
      port.close();
    } catch {}
  }
});
