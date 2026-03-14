import Link from "next/link";

import type { LegalDocument, LegalDocumentKind } from "@/lib/legalContent";

function sectionHref(id: string) {
  return `#${id}`;
}

const RELATED_LINKS: Array<{ kind: LegalDocumentKind; href: string; label: string }> = [
  { kind: "terms", href: "terms", label: "Terms" },
  { kind: "privacy", href: "privacy", label: "Privacy" },
  { kind: "returns", href: "returns", label: "Returns" },
  { kind: "shipping", href: "shipping", label: "Shipping" },
  { kind: "cookie", href: "cookie-policy", label: "Cookies" },
];

export function LegalDocumentPage({
  document,
  lang,
  currentKind,
}: {
  document: LegalDocument;
  lang: string;
  currentKind: LegalDocumentKind;
}) {
  const relatedLinks = RELATED_LINKS.filter((link) => link.kind !== currentKind);

  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Effective {document.effectiveDate}
        </p>
        <h1 className="text-4xl font-display">{document.title}</h1>
        <p className="text-base text-muted-foreground">{document.summary}</p>
        <div className="space-y-3 text-sm leading-7 text-muted-foreground">
          {document.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-4">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border/70 bg-accent-soft p-5">
            <h2 className="text-sm font-medium text-foreground">On this page</h2>
            <nav className="mt-4 space-y-2 text-sm text-muted-foreground">
              {document.sections.map((section) => (
                <a
                  key={section.id}
                  href={sectionHref(section.id)}
                  className="flex min-h-11 min-w-11 items-center transition-colors hover:text-foreground"
                >
                  {section.heading}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-8 lg:col-span-3">
          {document.sections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="scroll-mt-28 rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm"
            >
              <h2 className="text-2xl font-display">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}

          <div className="rounded-3xl border border-border/70 bg-accent-soft p-6">
            <h2 className="text-lg font-medium text-foreground">Related policies</h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {relatedLinks.map((link) => (
                <Link
                  key={link.kind}
                  href={`/${lang}/${link.href}`}
                  className="rounded-full border border-border/70 px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
