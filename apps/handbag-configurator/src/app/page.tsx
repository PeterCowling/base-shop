import { useTranslations as loadServerTranslations } from "@acme/i18n/useTranslations.server";
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
  const t = await loadServerTranslations("en");
  try {
    schema = await loadSchema();
  } catch (err) {
    const message = err instanceof Error ? err.message : t("handbagConfigurator.errors.unknownError");
    error = t("handbagConfigurator.errors.schemaFetchFailed", {
      origin: API_ORIGIN,
      message,
    });
  }

  return <ConfiguratorPage schema={schema} apiOrigin={API_ORIGIN} error={error} />;
}
