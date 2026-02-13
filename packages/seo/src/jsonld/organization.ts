export function organizationJsonLd({
  name,
  url,
  logo,
}: {
  name: string;
  url?: string;
  logo?: string;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
  };
  if (url) data.url = url;
  if (logo) data.logo = logo;
  return data;
}
