// packages/template-app/src/app/[lang]/stores/[id]/page.tsx
import { getStoreById } from "@/data/stores";
import { StoreLocatorMap } from "@acme/ui/src/components/organisms/StoreLocatorMap";

export const dynamic = "force-static";

export default async function StorePage({ params }: { params: Promise<{ lang?: string; id: string }> }) {
  const { id } = await params;
  const store = getStoreById(id);
  if (!store) return <div className="p-8">Store not found.</div>;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.label,
    url: typeof window === "undefined" ? undefined : window.location.href,
    telephone: store.phone,
    address: store.address ? { "@type": "PostalAddress", streetAddress: store.address } : undefined,
    openingHours: store.openingHours,
    geo: { "@type": "GeoCoordinates", latitude: store.lat, longitude: store.lng },
  } as const;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{store.label}</h1>
      {typeof window !== "undefined" ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
      <StoreLocatorMap locations={[store]} heightClass="h-80" />
      {store.address ? <div className="text-sm">{store.address}</div> : null}
      {store.phone ? <div className="text-sm">Tel: {store.phone}</div> : null}
      {store.openingHours?.length ? (
        <ul className="list-disc pl-4 text-sm">
          {store.openingHours.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

