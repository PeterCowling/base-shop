export function websiteSearchJsonLd({
  name,
  url,
  searchUrlTemplate,
}: {
  name: string;
  url: string;
  searchUrlTemplate: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: searchUrlTemplate,
      // i18n-exempt -- SEO-04 Schema.org SearchAction protocol constant [ttl=2027-12-31]
      "query-input": "required name=search_term_string",
    },
  };
}
