import Link from "next/link";

import { getChromeContent } from "@/lib/contentPacket";

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
  const chrome = getChromeContent(lang as "en" | "de" | "it");

  return (
    <details className="border-t pt-5 text-sm text-muted-foreground">
      <summary className="cursor-pointer list-none font-medium text-foreground">
        {chrome.trust.summary}
      </summary>
      <div className="mt-3 space-y-2">
        {shippingSummary && <p>{shippingSummary}</p>}
        {returnsSummary && <p>{returnsSummary}</p>}
        <div className="mt-1 flex gap-4">
          <Link
            href={`/${lang}/shipping`}
            className="underline transition-colors hover:text-foreground"
          >
            {chrome.trust.shippingLink}
          </Link>
          <Link
            href={`/${lang}/returns`}
            className="underline transition-colors hover:text-foreground"
          >
            {chrome.trust.returnsLink}
          </Link>
        </div>
      </div>
    </details>
  );
}
