/* Minimal MessageChannel polyfill so react-dom/server 19 stops crashing */
if (typeof global.MessageChannel === "undefined") {
  class DummyPort {}
  class DummyMessageChannel {
    constructor() {
      this.port1 = new DummyPort();
      this.port2 = new DummyPort();
    }
  }
  global.MessageChannel = DummyMessageChannel;
}
