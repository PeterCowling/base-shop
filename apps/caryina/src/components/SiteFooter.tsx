import Image from "next/image";
import Link from "next/link";

import { getChromeContent } from "@/lib/contentPacket";

export function SiteFooter({ lang }: { lang: string }) {
  const chrome = getChromeContent(lang as "en" | "de" | "it");

  const footerLinks: Array<{ href: string; label: string }> = [
    { href: "terms", label: chrome.footer.terms },
    { href: "privacy", label: chrome.footer.privacy },
    { href: "cookie-policy", label: chrome.footer.cookie },
    { href: "returns", label: chrome.footer.returnsRefunds },
    { href: "shipping", label: chrome.footer.shipping },
    { href: "support", label: chrome.footer.support },
  ];

  return (
    <footer className="mt-20 border-t bg-accent-soft">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/images/caryina-logo.webp"
            alt="Caryina — Un solo dettaglio. Quello carino."
            width={127}
            height={60}
            className="h-16 w-auto"
          />
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2"
            aria-label={chrome.footer.sectionAriaLabel}
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
        {/* Social links — TODO: PLACEHOLDER replace with actual handles before deploy */}
        <div className="flex items-center gap-4 text-xs">
          {/* TODO: PLACEHOLDER — replace with actual Instagram handle */}
          <a
            href="https://instagram.com/caryina"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Instagram
          </a>
          {/* TODO: PLACEHOLDER — replace with actual TikTok handle */}
          <a
            href="https://tiktok.com/@caryina"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            TikTok
          </a>
        </div>
        <div className="border-t pt-4 text-xs">
          <p>&copy; {new Date().getFullYear()} Caryina. {chrome.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
