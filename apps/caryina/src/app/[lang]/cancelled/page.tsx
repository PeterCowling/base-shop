import type { Metadata } from "next";
import Link from "next/link";

import { resolveLocale } from "@acme/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  return { title: `Checkout cancelled (${lang}) | Caryina` };
}

export default async function CancelledPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);

  return (
    <section className="space-y-6 text-center">
      <h1 className="text-4xl font-display">Checkout cancelled</h1>
      <p className="mx-auto max-w-xl text-muted-foreground">
        Your order was not completed. You can return to the catalog and restart the flow
        anytime.
      </p>
      <div>
        <Link href={`/${lang}/shop`} className="text-sm hover:underline">
          Back to shop
        </Link>
      </div>
    </section>
  );
}
