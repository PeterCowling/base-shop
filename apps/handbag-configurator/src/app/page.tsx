import type { ProductConfigSchema } from "@acme/product-configurator";
import { ConfiguratorPage } from "./ConfiguratorPage";

const API_ORIGIN =
  process.env["HANDBAG_CONFIGURATOR_API_ORIGIN"] ?? "http://localhost:3017";

async function loadSchema() {
  const url = `${API_ORIGIN}/config/schema?productId=bag-001`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ProductConfigSchema;
}

export default async function Page() {
  let schema: ProductConfigSchema | null = null;
  let error: string | null = null;
  try {
    schema = await loadSchema();
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Unknown error" /* i18n-exempt -- HB-1124 [ttl=2026-12-31] server error fallback */;
    error = `Schema fetch failed (${API_ORIGIN}). ${message}`;
  }

  return <ConfiguratorPage schema={schema} apiOrigin={API_ORIGIN} error={error} />;
}
