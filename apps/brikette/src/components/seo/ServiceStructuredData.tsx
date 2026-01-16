// src/components/seo/ServiceStructuredData.tsx
import { memo, useMemo } from "react";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useLocation } from "react-router-dom";

type MonetaryAmount = {
  price: string;
  priceCurrency?: string;
  availability?: string;
  description?: string;
};

type Props = {
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string;
  providerName?: string;
  image?: string;
  sameAs?: string[];
  offers?: MonetaryAmount[];
  inLanguage?: string;
  url?: string;
};

function ServiceStructuredData({
  name,
  description,
  serviceType,
  areaServed = "Positano, Amalfi Coast",
  providerName = "Local providers",
  image,
  sameAs,
  offers,
  inLanguage,
  url,
}: Props): JSX.Element {
  const lang = useCurrentLanguage();
  const { pathname } = useLocation();

  const json = useMemo(() => {
    const resolvedLang = inLanguage ?? lang;
    const resolvedUrl = url ?? `https://hostel-positano.com${pathname}`;

    const offerPayload = Array.isArray(offers)
      ? offers
          .filter(
            (offer): offer is MonetaryAmount & { price: string } =>
              typeof offer?.price === "string" && offer.price.trim().length > 0
          )
          .map((offer) => ({
            "@type": "Offer",
            price: offer.price,
            ...(offer.priceCurrency ? { priceCurrency: offer.priceCurrency } : {}),
            ...(offer.availability ? { availability: offer.availability } : {}),
            ...(offer.description ? { description: offer.description } : {}),
            // Best-effort UnitPriceSpecification when we can parse a numeric value
            ...(() => {
              if (!offer.priceCurrency) return {};
              const num = parseFloat(offer.price.replace(/[^0-9.,]/g, "").replace(",", "."));
              if (Number.isFinite(num)) {
                return {
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: num,
                    priceCurrency: offer.priceCurrency!,
                    unitCode: "NI",
                  },
                };
              }
              return {};
            })(),
          }))
      : [];

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      inLanguage: resolvedLang,
      url: resolvedUrl,
      name,
      description,
      ...(serviceType ? { serviceType } : {}),
      areaServed: { "@type": "Place", name: areaServed },
      provider: { "@type": "Organization", name: providerName },
      ...(image ? { image } : {}),
      ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
      ...(offerPayload.length > 0 ? { offers: offerPayload } : {}),
    });
  }, [
    areaServed,
    description,
    image,
    lang,
    name,
    offers,
    pathname,
    providerName,
    sameAs,
    serviceType,
    inLanguage,
    url,
  ]);

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default memo(ServiceStructuredData);
