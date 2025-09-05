// apps/cms/dev-hooks/stackdump.js
if (!global.__STACKDUMP_INSTALLED__) {
  global.__STACKDUMP_INSTALLED__ = true;

  // Don't monkey‑patch require at all; it creates noise from optional probes.
  const fmt = (x) => {
    if (x && x.stack) return x.stack;
    try {
      const str = JSON.stringify(x);
      return typeof str === "string" ? str : String(x);
    } catch {
      return String(x);
    }
  };

  process.on("uncaughtException", (err) => {
    console.error("[dev-hooks] uncaughtException\n", fmt(err));
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[dev-hooks] unhandledRejection\n", fmt(reason));
  });

  // Optional: surface unusual process warnings (kept conservative)
  process.on("warning", (w) => {
    const code = w && (w.code || "");
    if (/^DEP_WEBPACK/.test(code)) return; // ignore common webpack deprecations
    console.warn("[dev-hooks] warning\n", fmt(w));
  });
}
