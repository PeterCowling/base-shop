try {
  Object.defineProperty(globalThis, "window", {
    get: () => undefined,
    set: () => undefined,
    configurable: true,
  });
} catch {
  // ignore
}

try {
  const doc = globalThis.document;
  if (doc && typeof doc.querySelector !== "function") {
    doc.querySelector = () => null;
  }
} catch {
  // ignore
}
