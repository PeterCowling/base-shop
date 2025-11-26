import Link from "next/link";
import { localizedPath } from "@/lib/routes";
import type { TypoSectionProps } from "./types";

export function TypoRealEstateSection({ lang, translator }: TypoSectionProps) {
  const propertyHighlights = translator("realEstate.properties")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <section className="loket-real loket-real--bare">
      <div className="loket-real__copy">
        <p className="loket-real__eyebrow">{translator("realEstate.heading")}</p>
        <p className="loket-real__intro">{translator("realEstate.intro")}</p>
      </div>
      <ul className="loket-real__list">
        {propertyHighlights.map((property) => (
          <li key={property}>{property}</li>
        ))}
      </ul>
      <Link href={localizedPath(lang, "realEstate")} className="loket-real__cta">
        {translator("realEstate.cta")}
      </Link>
    </section>
  );
}
