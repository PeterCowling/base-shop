import type { Metadata } from "next";
import Link from "next/link";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import {
  getSeoKeywords,
  getSupportContent,
} from "@/lib/contentPacket";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getSupportContent(lang);
  return {
    title: `${content.title} | Caryina`,
    description: content.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getSupportContent(lang);
  const policyLinks = [
    { href: `/${lang}/terms`, label: "Terms of sale and website use" },
    { href: `/${lang}/privacy`, label: "Privacy policy" },
    { href: `/${lang}/cookie-policy`, label: "Cookie policy" },
    { href: `/${lang}/returns`, label: "Returns and refunds" },
    { href: `/${lang}/shipping`, label: "Shipping and delivery" },
  ];

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-display">{content.title}</h1>
      <p className="max-w-2xl text-muted-foreground">
        {content.summary}
      </p>

      <div className="max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground">
        <h2 className="text-base font-medium text-foreground">Support channels</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {content.channels.map((channel) => (
            <li key={channel}>{channel}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm">{content.responseSla}</p>
      </div>

      <div className="max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground">
        <h2 className="text-base font-medium text-foreground">Track your order</h2>
        <p className="mt-3">
          We ship via DHL. Your tracking link will arrive by email after dispatch. Visit the{" "}
          <a
            href="https://www.dhl.com/en/express/tracking.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            DHL tracking page
          </a>{" "}
          or reply to your shipping confirmation email.
        </p>
      </div>

      <div className="max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground">
        <h2 className="text-base font-medium text-foreground">How to pay</h2>
        <p className="mt-3">
          We accept Visa, Mastercard, American Express, Apple Pay, and Google Pay via secure checkout.
        </p>
        {/* TODO: PLACEHOLDER — operator to confirm exact payment methods enabled in Stripe/Axerve configuration */}
      </div>

      <div className="max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground">
        <h2 className="text-base font-medium text-foreground">Policies and legal requests</h2>
        <p className="mt-3">
          Use the same support route for cancellation requests, exchange requests, privacy
          requests, delivery issues, and faulty-item claims.
        </p>
        <div className="mt-4 space-y-1">
          <p>
            <span className="font-medium text-foreground">Legal entity:</span> Skylar SRL
          </p>
          <p>
            <span className="font-medium text-foreground">Registered office:</span> Via Guglielmo
            Marconi, 358, 84017, Positano, Salerno, Italy
          </p>
          <p>
            <span className="font-medium text-foreground">VAT number:</span> 05476940654
          </p>
          <p>
            <span className="font-medium text-foreground">Official email:</span>{" "}
            <a
              className="inline-flex min-h-11 min-w-11 items-center underline underline-offset-4"
              href="mailto:hostelpositano@gmail.com"
            >
              hostelpositano@gmail.com
            </a>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {policyLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border px-4 py-2 text-foreground transition-colors hover:bg-accent-soft"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
