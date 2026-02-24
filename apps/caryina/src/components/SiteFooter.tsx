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
    <footer
      className="border-t border-solid"
      style={{
        borderTopColor: "hsl(var(--color-border-muted))",
      }}
    >
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-6 py-8 text-sm text-muted-foreground sm:grid-cols-2 sm:items-center">
        {/* i18n-exempt -- CARYINA-104 [ttl=2026-12-31] */}
        <p>Caryina</p>
        <nav
          className="grid grid-flow-col auto-cols-max gap-4 sm:justify-self-end"
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
    </footer>
  );
}
