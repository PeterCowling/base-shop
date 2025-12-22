// src/types/global.d.ts
/**
 * Ambient declarations for SSR-safe “global” shims.
 * These types are automatically visible everywhere—no import needed.
 */

export {}; // keep the file a module

declare global {
  /** Minimal subset we actually read from/assign to in Node tests */
  interface WindowShim {
    location: { href: string };
    history?: History;
    [key: string]: unknown;
  }

  interface DocumentShim {
    addEventListener: (...args: unknown[]) => void;
    removeEventListener: (...args: unknown[]) => void;
    body: {
      style: Record<string, unknown>;
      appendChild?: (...args: unknown[]) => unknown;
      removeChild?: (...args: unknown[]) => unknown;
      contains?: (...args: unknown[]) => boolean;
      [key: string]: unknown;
    };
    head?: {
      appendChild?: (...args: unknown[]) => unknown;
      removeChild?: (...args: unknown[]) => unknown;
      contains?: (...args: unknown[]) => boolean;
      [key: string]: unknown;
    };
    createElement: (...args: unknown[]) => unknown;
    createElementNS?: (...args: unknown[]) => unknown;
    createTextNode?: (...args: unknown[]) => unknown;
    createDocumentFragment?: (...args: unknown[]) => unknown;
    [key: string]: unknown;
  }

  /**
   * “Global” reference used in `ModalContext`.
   * • In browsers it’s the real `globalThis`.
   * • In Node we poly-fill just enough shape to compile & test.
   */
  interface GlobalRef {
    window: Window | WindowShim;
    document: Document | DocumentShim;
    [key: string]: unknown;
  }
}
