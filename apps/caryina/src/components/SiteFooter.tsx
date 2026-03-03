import Image from "next/image";
import Link from "next/link";

// i18n-exempt -- CARYINA-103 [ttl=2026-12-31]
const footerLinks: Array<{ href: string; label: string }> = [
  { href: "terms", label: "Terms" },
  { href: "privacy", label: "Privacy" },
  { href: "returns", label: "Returns & Refunds" },
  { href: "shipping", label: "Shipping" },
  { href: "support", label: "Support" },
];

export function SiteFooter({ lang }: { lang: string }) {
  return (
    <footer className="mt-20 border-t bg-accent-soft">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* i18n-exempt -- CARYINA-104 [ttl=2026-12-31] */}
          <Image
            src="/images/caryina-logo.webp"
            alt="Caryina — Un solo dettaglio. Quello carino."
            width={127}
            height={60}
            className="h-16 w-auto"
          />
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2"
            aria-label="Footer"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${lang}/${link.href}`}
                className="hover:text-foreground hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t pt-4 text-xs">
          {/* i18n-exempt -- CARYINA-105 [ttl=2026-12-31] */}
          <p>&copy; {new Date().getFullYear()} Caryina. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
