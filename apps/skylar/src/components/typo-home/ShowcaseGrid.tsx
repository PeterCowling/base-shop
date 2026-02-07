import Image from "next/image";
import Link from "next/link";

import { joinClasses } from "@/lib/joinClasses";
import { localizedPath } from "@/lib/routes";

import type { TypoSectionProps } from "./types";

type ShowcaseItem = {
  image: string;
  width: number;
  height: number;
  label: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  alt: string;
  external: boolean;
};

export function TypoShowcaseGrid({ lang, translator }: TypoSectionProps) {
  const showcases: ShowcaseItem[] = [
    {
      image: "/landing-mobile.avif",
      width: 420,
      height: 360,
      label: translator("showcase.hostel.label"),
      title: translator("showcase.hostel.title"),
      body: translator("showcase.hostel.body"),
      href: translator("links.hostel"),
      cta: translator("showcase.hostel.cta"),
      alt: translator("showcase.hostel.imageAlt"),
      external: true,
    },
    {
      image: "/StepFree.png",
      width: 420,
      height: 360,
      label: translator("showcase.step.label"),
      title: translator("showcase.step.title"),
      body: translator("showcase.step.body"),
      href: localizedPath(lang, "realEstate"),
      cta: translator("showcase.step.cta"),
      alt: translator("showcase.step.imageAlt"),
      external: false,
    },
  ];

  return (
    <section className="loket-showcase-grid">
      {showcases.map((item, index) => (
        <article
          key={item.title}
          className={joinClasses("loket-showcase", index % 2 === 1 && "loket-showcase--invert")}
        >
          <div className="loket-showcase__media" aria-hidden="true">
            <Image
              src={item.image}
              alt={item.alt}
              width={item.width}
              height={item.height}
              className="loket-showcase__image"
              priority={index === 0}
            />
          </div>
          <div className="loket-showcase__content">
            <p className="loket-showcase__label">{item.label}</p>
            <h2 className="loket-showcase__title">{item.title}</h2>
            <p className="loket-showcase__body">{item.body}</p>
            <Link
              className="loket-link"
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
            >
              {item.cta}
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
