import Link from "next/link";

// i18n-exempt -- CARYINA-106 [ttl=2026-12-31]
const TRUST_SUMMARY =
  "Free exchange within 30 days · Delivery estimated at checkout";

interface ShippingReturnsTrustBlockProps {
  shippingSummary: string;
  returnsSummary: string;
  lang: string;
}

export default function ShippingReturnsTrustBlock({
  shippingSummary,
  returnsSummary,
  lang,
}: ShippingReturnsTrustBlockProps) {
  return (
    <details className="border-t pt-5 text-sm text-muted-foreground">
      <summary className="cursor-pointer list-none font-medium text-foreground">
        {TRUST_SUMMARY}
      </summary>
      <div className="mt-3 space-y-2">
        {shippingSummary && <p>{shippingSummary}</p>}
        {returnsSummary && <p>{returnsSummary}</p>}
        <div className="mt-1 flex gap-4">
          <Link
            href={`/${lang}/shipping`}
            className="underline transition-colors hover:text-foreground"
          >
            {/* i18n-exempt -- CARYINA-106 [ttl=2026-12-31] */}
            Shipping policy
          </Link>
          <Link
            href={`/${lang}/returns`}
            className="underline transition-colors hover:text-foreground"
          >
            {/* i18n-exempt -- CARYINA-106 [ttl=2026-12-31] */}
            Returns &amp; exchanges
          </Link>
        </div>
      </div>
    </details>
  );
}
