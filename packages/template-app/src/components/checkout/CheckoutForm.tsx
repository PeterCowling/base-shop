import type { Locale } from "@acme/i18n/locales";

export default function CheckoutForm({
  locale: _locale,
  taxRegion: _taxRegion,
  coverage: _coverage,
}: {
  locale: Locale;
  taxRegion: string;
  coverage: string[];
}) {
  return <div>CheckoutForm</div>;
}
