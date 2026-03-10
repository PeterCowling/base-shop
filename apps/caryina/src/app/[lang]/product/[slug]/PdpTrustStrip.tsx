import Link from "next/link";

import type { Locale } from "@acme/i18n/locales";

import { getTrustStripContent } from "@/lib/contentPacket";

interface PdpTrustStripProps {
  lang: Locale;
}

export function PdpTrustStrip({ lang }: PdpTrustStripProps) {
  const trustStrip = getTrustStripContent(lang);

  if (!trustStrip) {
    return null;
  }

  return (
    <ul
      data-cy="pdp-trust-strip"
      className="list-none space-y-2.5 border-t pt-4 text-xs text-muted-foreground"
    >
      {/* Delivery item — links to /${lang}/shipping */}
      <li className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <Link href={`/${lang}/shipping`} className="hover:text-foreground">
          {trustStrip.delivery}
        </Link>
      </li>

      {/* Exchange item — links to /${lang}/returns */}
      <li className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        <Link href={`/${lang}/returns`} className="hover:text-foreground">
          {trustStrip.exchange}
        </Link>
      </li>

      {/* Origin item — no link */}
      <li className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        <span>{trustStrip.origin}</span>
      </li>

      {/* Secure payment item — no link */}
      <li className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <span>{trustStrip.securePayment}</span>
      </li>
    </ul>
  );
}
