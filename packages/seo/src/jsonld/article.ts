export function articleJsonLd({
  headline,
  description,
  datePublished,
  author,
  image,
  url,
}: {
  headline: string;
  description?: string;
  datePublished?: string;
  author?: string;
  image?: string;
  url?: string;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
  };
  if (description) data.description = description;
  if (datePublished) data.datePublished = datePublished;
  if (author) data.author = { "@type": "Person", name: author };
  if (image) data.image = image;
  if (url) data.url = url;
  return data;
}
