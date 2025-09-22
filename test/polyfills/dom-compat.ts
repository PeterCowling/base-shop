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

// WHATWG encoders/decoders used by various libs
(globalThis as any).TextEncoder ||= TextEncoder;
(globalThis as any).TextDecoder ||= TextDecoder;

// Basic File and crypto availability
(globalThis as any).File ||= NodeFile;
(globalThis as any).crypto ||= webcrypto;

// JSDOM doesn't implement object URLs; provide minimal stubs used in tests
if (!(URL as any).createObjectURL) {
  (URL as any).createObjectURL = () => "blob:mock";
}
if (!(URL as any).revokeObjectURL) {
  (URL as any).revokeObjectURL = () => {};
}

// Missing DOM APIs used by Radix UI & others
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (
  typeof HTMLElement !== "undefined" &&
  !(HTMLElement.prototype as any).hasPointerCapture
) {
  (HTMLElement.prototype as any).hasPointerCapture = () => false;
  (HTMLElement.prototype as any).setPointerCapture = () => {};
  (HTMLElement.prototype as any).releasePointerCapture = () => {};
}

// Minimal ResizeObserver stub for JSDOM tests (measurements not needed for logic assertions)
if (!(globalThis as any).ResizeObserver) {
  class RO {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(_cb: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = RO as any;
}
