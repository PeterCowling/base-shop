// src/context/modal/environment.ts
/* -------------------------------------------------------------------------- */
/*  SSR-safe global reference helpers                                         */
/* -------------------------------------------------------------------------- */

/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] DOM shim constants are not user-facing */
import { IS_TEST } from "@/config/env";

const detectTestRuntime =
  Boolean((globalThis as Record<string, unknown> | undefined)?.["__VITEST_ENV__"]) || IS_TEST;

let forcedTestRuntime: boolean | undefined;

const isTestRuntime = (): boolean =>
  typeof forcedTestRuntime === "boolean" ? forcedTestRuntime : detectTestRuntime;

const globalRef: GlobalRef =
  typeof globalThis !== "undefined"
    ? (globalThis as GlobalRef)
    : typeof global !== "undefined"
    ? (global as unknown as GlobalRef)
    : ({} as GlobalRef);

interface ShimNode {
  nodeType: number;
  nodeName: string;
  tagName?: string;
  style?: Record<string, unknown>;
  ownerDocument?: DocumentShim;
  parentNode: ShimNode | null;
  childNodes: ShimNode[];
  appendChild: (node: ShimNode) => ShimNode;
  removeChild: (node: ShimNode) => ShimNode;
  contains: (node: ShimNode) => boolean;
  addEventListener?: (...args: unknown[]) => void;
  removeEventListener?: (...args: unknown[]) => void;
  setAttribute?: (name: string, value: unknown) => void;
  removeAttribute?: (name: string) => void;
  attributes?: Record<string, unknown>;
}

const createShimNode = (nodeType: number, nodeName: string, withStyle = false): ShimNode => {
  const node: ShimNode = {
    nodeType,
    nodeName,
    parentNode: null,
    childNodes: [],
    appendChild(child: ShimNode) {
      child.parentNode = node;
      node.childNodes.push(child);
      return child;
    },
    removeChild(child: ShimNode) {
      const index = node.childNodes.indexOf(child);
      if (index >= 0) {
        node.childNodes.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    },
    contains(target: ShimNode) {
      if (node.childNodes.includes(target)) return true;
      return node.childNodes.some((child) => child.contains(target));
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute(name: string, value: unknown) {
      if (!node.attributes) {
        node.attributes = {};
      }
      node.attributes[name] = value;
    },
    removeAttribute(name: string) {
      if (!node.attributes) return;
      delete node.attributes[name];
    },
  };
  if (nodeType === 1) {
    node.tagName = nodeName;
  }
  if (withStyle) {
    node.style = {};
  }

  return node;
};

const createDocumentShim = (): DocumentShim => {
  const body = createShimNode(1, "BODY", true);
  const head = createShimNode(1, "HEAD");

  const createElement = (tagName: string): ShimNode & Record<string, unknown> => {
    const element = createShimNode(1, tagName.toUpperCase(), true) as ShimNode &
      Record<string, unknown>;
    element.ownerDocument = documentShim;
    return element;
  };

  const documentShim: DocumentShim = {
    nodeType: 9,
    nodeName: "#document",
    addEventListener: () => {},
    removeEventListener: () => {},
    body: body as unknown as DocumentShim["body"],
    head: head as unknown as DocumentShim["head"],
    createElement: (tagName: string) => createElement(tagName),
    createElementNS: (_ns: string, tagName: string) => createElement(tagName),
    createTextNode: (value: string) => ({
      nodeType: 3,
      nodeName: "#text",
      nodeValue: value,
      parentNode: null,
    }),
    createDocumentFragment: () => createShimNode(11, "#document-fragment"),
  } as DocumentShim;

  body.ownerDocument = documentShim;
  head.ownerDocument = documentShim;

  return documentShim;
};

if (typeof globalRef.window === "undefined") {
  globalRef.window = { location: { href: "" } };
}

let fallbackDocument: Document | DocumentShim | undefined =
  typeof globalRef.document !== "undefined" ? globalRef.document : undefined;

if (typeof globalRef.document === "undefined") {
  const shim = createDocumentShim();
  globalRef.document = shim;
  fallbackDocument = shim;
}

const ensureDocument = (): Document | DocumentShim | undefined => {
  const current = globalRef.document as Document | DocumentShim | undefined;
  if (current) {
    if (!fallbackDocument) {
      fallbackDocument = current;
    }
    return current;
  }

  if (fallbackDocument) {
    globalRef.document = fallbackDocument;
    return fallbackDocument;
  }

  const shim = createDocumentShim();
  globalRef.document = shim;
  fallbackDocument = shim;
  return shim;
};

const setWindowLocationHref = (nextHref: string): void => {
  const location = globalRef.window?.location;
  if (!location) return;

  if (isTestRuntime()) {
    location.href = nextHref;
    return;
  }

  const attempt = (fn: () => void): void => {
    try {
      fn();
    } catch {
      // Swallow errors so we can try additional fallbacks in non-browser environments.
    }
  };

  attempt(() => {
    location.href = nextHref;
  });

  const currentHref = location.href;
  if (currentHref === nextHref) {
    return;
  }

  const maybeLocation = location as unknown as Location;

  if (typeof maybeLocation.assign === "function") {
    attempt(() => {
      maybeLocation.assign(nextHref);
    });
    if (location.href === nextHref) {
      return;
    }
  }

  if (typeof maybeLocation.replace === "function") {
    attempt(() => {
      maybeLocation.replace(nextHref);
    });
    if (location.href === nextHref) {
      return;
    }
  }

  attempt(() => {
    Object.defineProperty(location as object, "href", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: nextHref,
    });
  });

  if (location.href !== nextHref) {
    attempt(() => {
      location.href = nextHref;
    });
  }
};

const setTestRuntimeForTests = (value: boolean | undefined): void => {
  forcedTestRuntime = value;
};

export { ensureDocument, globalRef, setWindowLocationHref, setTestRuntimeForTests };
