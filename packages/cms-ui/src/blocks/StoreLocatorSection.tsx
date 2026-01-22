"use client";

import * as React from "react";

import { useTranslations } from "@acme/i18n";
import { type Location,StoreLocatorMap } from "@acme/ui/components/organisms/StoreLocatorMap";

type Store = Location & {
  id: string;
  address?: string;
  phone?: string;
  url?: string;
  openingHours?: string[];
  stockNote?: string;
};

export interface StoreLocatorSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  stores?: Store[];
  /** Optional async adapter to load stores */
  adapter?: () => Promise<Store[]>;
  enableGeolocation?: boolean;
  radiusKm?: number;
  emitLocalBusiness?: boolean;
}

function haversine(a: Location, b: Location): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

// Move nested components out of render to satisfy react/no-unstable-nested-components
const Grid: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => <div {...props} />;

export default function StoreLocatorSection({ stores: inputStores = [], adapter, enableGeolocation = true, radiusKm = 100, emitLocalBusiness = false, className, ...rest }: StoreLocatorSectionProps) {
  const t = useTranslations();
  const [stores, setStores] = React.useState<Store[]>(inputStores);
  const [origin, setOrigin] = React.useState<Location | null>(null);
  const [selected, setSelected] = React.useState<Store | null>(null);

  React.useEffect(() => { setStores(inputStores); }, [inputStores]);
  React.useEffect(() => {
    let active = true;
    if (!adapter) return;
    adapter().then((s) => { if (active) setStores(s); }).catch(() => {});
    return () => { active = false; };
  }, [adapter]);

  React.useEffect(() => {
    if (!enableGeolocation || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setOrigin(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  }, [enableGeolocation]);

  const filtered = React.useMemo(() => {
    if (!origin) return stores;
    return stores
      .map((s) => ({ s, d: haversine(origin, s) }))
      .filter((x) => x.d <= radiusKm)
      .sort((a, b) => a.d - b.d)
      .map(({ s }) => s);
  }, [stores, origin, radiusKm]);

  const jsonLd = React.useMemo(() => {
    if (!emitLocalBusiness || !selected) return null;
    const data = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: selected.label,
      url: selected.url,
      telephone: selected.phone,
      address: selected.address ? { "@type": "PostalAddress", streetAddress: selected.address } : undefined,
      geo: { "@type": "GeoCoordinates", latitude: selected.lat, longitude: selected.lng },
      openingHours: selected.openingHours,
    };
    const SCRIPT_TYPE_JSONLD = "application/ld+json"; // i18n-exempt -- I18N-0003 [ttl=2025-01-31] script type value
    // i18n-exempt -- I18N-0003 [ttl=2025-01-31] JSON-LD structured data, not user-visible copy
    return <script type={SCRIPT_TYPE_JSONLD} dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
  }, [emitLocalBusiness, selected]);

  return (
    <section className={className} {...rest}>
      {jsonLd}
      <Grid className="mx-auto grid grid-cols-1 gap-6 md:grid-cols-3">
        <aside className="space-y-3">
          <h3 className="text-lg font-semibold">{t("storeLocator.findAStore")}</h3>
          {origin ? (
            <p className="text-sm text-muted-foreground">{t("storeLocator.showingWithin", { radiusKm })}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("storeLocator.enableLocationToSort")}</p>
          )}
          <ul className="divide-y border rounded">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={(() => {
                    // i18n-exempt -- ABC-123 [ttl=2025-01-31]
                    const ITEM_BASE_CLASS = "block w-full text-left p-3 min-h-10";
                    // i18n-exempt -- ABC-123 [ttl=2025-01-31]
                    const ITEM_SELECTED_CLASS = "bg-muted";
                    // i18n-exempt -- ABC-123 [ttl=2025-01-31]
                    const ITEM_DEFAULT_CLASS = "bg-card";
                    return [ITEM_BASE_CLASS, selected?.id === s.id ? ITEM_SELECTED_CLASS : ITEM_DEFAULT_CLASS].join(" ");
                  })()}
                  onClick={() => setSelected(s)}
                >
                  <div className="font-medium">{s.label}</div>
                  {s.address ? <div className="text-sm text-muted-foreground">{s.address}</div> : null}
                  {s.stockNote ? <div className="text-xs text-primary">{s.stockNote}</div> : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="md:col-span-2">
          <StoreLocatorMap locations={selected ? [selected] : stores} heightClass="h-96" />
          {selected ? (
            <div className="mt-3 rounded border p-3 text-sm">
              <div className="font-medium">{selected.label}</div>
              {selected.address ? <div>{selected.address}</div> : null}
              {selected.phone ? <div>{t("storeLocator.tel", { phone: selected.phone })}</div> : null}
              {selected.openingHours?.length ? (
                <ul className="mt-2 list-disc ps-4">
                  {selected.openingHours.map((h) => (<li key={h}>{h}</li>))}
                </ul>
              ) : null}
              {selected.url ? (
                <a
                  href={selected.url}
                  className="mt-2 inline-block text-primary underline min-h-10 min-w-10"
                >
                  {t("storeLocator.viewStorePage")}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </Grid>
    </section>
  );
}
