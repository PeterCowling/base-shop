import Image from "next/image";
import Link from "next/link";

interface ProductMediaCardProps {
  href: string;
  category?: string | null;
  title: string;
  priceLabel: string;
  primarySrc: string;
  primaryAlt: string;
  secondarySrc?: string | null;
  secondaryAlt?: string | null;
}

export function ProductMediaCard({
  href,
  category,
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
        <div className="media-aspect-portrait relative overflow-hidden rounded-xl bg-muted">
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
        {category ? (
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {category}
          </p>
        ) : null}
        <h2 className="text-sm font-medium leading-tight">
          <Link href={href} className="hover:underline focus-visible:underline">
            {title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{priceLabel}</p>
      </div>
    </article>
  );
}
