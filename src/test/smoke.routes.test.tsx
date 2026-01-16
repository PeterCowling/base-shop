import { describe, it } from "vitest";

const asBoolean = (value?: string): boolean => {
  if (!value) return false;
  const normalised = value.trim().toLowerCase();
  if (normalised === "0" || normalised === "false") return false;
  if (normalised === "1" || normalised === "true") return true;
  return Boolean(normalised.length);
};

const shouldRunSmokeSuite = asBoolean(process.env.RUN_ROUTE_SMOKE ?? process.env.CI);

if (!shouldRunSmokeSuite) {
  describe.skip("Route smoke render (default exports)", () => {
    it("skipped locally to keep pnpm test fast", () => undefined);
  });
} else {
  const { registerRouteSmokeSuite } = await import("./smoke.routes.suite.tsx");
  registerRouteSmokeSuite();
}