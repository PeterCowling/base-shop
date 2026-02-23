import Image from "next/image";
import Link from "next/link";

interface ProductMediaCardProps {
  href: string;
  slug: string;
  title: string;
  priceLabel: string;
  primarySrc: string;
  primaryAlt: string;
  secondarySrc?: string | null;
  secondaryAlt?: string | null;
}

export function ProductMediaCard({
  href,
  slug,
  title,
  priceLabel,
  primarySrc,
  primaryAlt,
  secondarySrc,
  secondaryAlt,
}: ProductMediaCardProps) {
  return (
    <article className="group media-card space-y-3">
      <Link href={href} className="block">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-solid bg-muted"
          style={{ borderColor: "hsl(var(--color-border-default))" }}
        >
          <Image
            src={primarySrc}
            alt={primaryAlt}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          {secondarySrc ? (
            <Image
              src={secondarySrc}
              alt={secondaryAlt ?? primaryAlt}
              fill
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
              className="media-card-secondary object-cover"
            />
          ) : null}
        </div>
      </Link>
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {slug}
        </p>
        <h2 className="text-lg font-display leading-tight">
          <Link href={href} className="hover:underline focus-visible:underline">
            {title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{priceLabel}</p>
      </div>
    </article>
  );
}
