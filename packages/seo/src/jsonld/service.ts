export function serviceJsonLd({
  name,
  provider,
  description,
  url,
  areaServed,
}: {
  name: string;
  provider?: string;
  description?: string;
  url?: string;
  areaServed?: string;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
  };
  if (provider) data.provider = { "@type": "Organization", name: provider };
  if (description) data.description = description;
  if (url) data.url = url;
  if (areaServed) data.areaServed = areaServed;
  return data;
}
