// packages/zod-utils/src/initZod.ts
// Small initializer that installs the friendly Zod error map.
//
// Jest's configuration for some packages runs in a CommonJS context
// where top-level `await` is not supported.  The original implementation
// used top-level `await` with a dynamic import, which caused Jest to bail
// out before any tests executed.  To keep the lazy loading behaviour
// without relying on top-level `await`, perform the dynamic import inside
// an async function and fire it immediately.  The returned promise is
// intentionally ignored – we only need the side-effect of installing the
// error map.

async function loadFriendlyMessages() {
  const { applyFriendlyZodMessages } = await import("./zodErrorMap.js");
  applyFriendlyZodMessages();
}

export function initZod(): void {
  void loadFriendlyMessages();
}

// Initialize immediately when this module is imported. The export remains
// so callers can re-run if needed.
initZod();
