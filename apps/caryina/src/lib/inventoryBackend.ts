// Backend is selected at runtime via the INVENTORY_BACKEND env var (set in wrangler.toml).
// Defaults to "json" when the var is absent so the app is safe in local dev without a DB.
export const CARYINA_INVENTORY_BACKEND = (
  process.env.INVENTORY_BACKEND ?? "json"
) as "json" | "prisma";
