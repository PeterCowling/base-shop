export function eventJsonLd({
  name,
  startDate,
  endDate,
  location,
  url,
  description,
}: {
  name: string;
  startDate: string;
  endDate?: string;
  location?: string;
  url?: string;
  description?: string;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    startDate,
  };
  if (endDate) data.endDate = endDate;
  if (location) data.location = { "@type": "Place", name: location };
  if (url) data.url = url;
  if (description) data.description = description;
  return data;
}
