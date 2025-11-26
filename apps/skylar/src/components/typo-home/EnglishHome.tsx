import Image from "next/image";
import Link from "next/link";
import { localizedPath } from "@/lib/routes";
import type { Locale } from "@/lib/locales";
import type { Translator } from "./types";

type Props = {
  lang: Locale;
  translator: Translator;
};

export function EnglishHome({ lang, translator }: Props) {
  const introColumns = [1, 2, 3].map((index) => ({
    heading: translator(`home.en.intro.column${index}.heading`),
    body: translator(`home.en.intro.column${index}.body`),
  }));
  const heroCategories = [
    {
      key: "electronics",
      label: translator("home.en.categories.electronics.label"),
      body: translator("home.en.categories.electronics.body"),
    },
    {
      key: "home",
      label: translator("home.en.categories.home.label"),
      body: translator("home.en.categories.home.body"),
    },
    {
      key: "bags",
      label: translator("home.en.categories.bags.label"),
      body: translator("home.en.categories.bags.body"),
    },
    {
      key: "pets",
      label: translator("home.en.categories.pets.label"),
      body: translator("home.en.categories.pets.body"),
    },
  ];

  return (
    <div className="skylar-typo skylar-typo--en">
      <section className="loket-intro-grid">
        {introColumns.map((column, index) => (
          <article key={`intro-${index}`} className="loket-intro-grid__col">
            <h3 className="loket-intro-grid__heading">{column.heading}</h3>
            <p>{column.body}</p>
          </article>
        ))}
      </section>

      <section className="loket-massive loket-massive--vertical">
        <h1 className="loket-massive__single-text">{translator("home.en.hero.products")}</h1>
        <div className="loket-massive__pair loket-massive__pair--categories">
          <section className="loket-category-row loket-category-row--stacked">
            {heroCategories.map((category) => (
              <article key={category.key} className="loket-category-card">
                <span className={`loket-category-card__icon loket-category-card__icon--${category.key}`} aria-hidden="true" />
                <h3>{category.label}</h3>
                <p>{category.body}</p>
              </article>
            ))}
          </section>
        </div>
        <section className="loket-split">
          <div className="loket-split__text">
            <p className="loket-split__eyebrow">{translator("home.en.story.eyebrow")}</p>
            <h2>{translator("home.en.story.heading")}</h2>
            <p>{translator("home.en.story.body")}</p>
            <Link href={localizedPath(lang, "products")} className="loket-link primary">
              {translator("home.en.story.cta")}
            </Link>
          </div>
          <div className="loket-split__media">
            <Image
              src="/handbag-insert.webp" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("home.en.images.storyOneAlt")}
              width={560}
              height={420}
              className="loket-split__image"
            />
          </div>
        </section>
        <section className="loket-split loket-split--reverse">
          <div className="loket-split__text">
            <p className="loket-split__eyebrow">{translator("home.en.story2.eyebrow")}</p>
            <h2>{translator("home.en.story2.heading")}</h2>
            <p>{translator("home.en.story2.body")}</p>
            <Link href={localizedPath(lang, "products")} className="loket-link primary">
              {translator("home.en.story2.cta")}
            </Link>
          </div>
          <div className="loket-split__media">
            <Image
              src="/dog-harness.webp" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("home.en.images.storyTwoAlt")}
              width={560}
              height={420}
              className="loket-split__image"
            />
          </div>
        </section>
        <h2 className="loket-massive__single-text loket-massive__single-text--secondary">
          {translator("home.en.hero.realEstate")}
        </h2>
        <section className="loket-split">
          <div className="loket-split__text">
            <p className="loket-split__eyebrow">{translator("home.en.realEstateStoryOne.eyebrow")}</p>
            <h2>{translator("home.en.realEstateStoryOne.heading")}</h2>
            <p>{translator("home.en.realEstateStoryOne.body")}</p>
            <Link href={localizedPath(lang, "realEstate")} className="loket-link primary">
              {translator("home.en.realEstateStory.cta")}
            </Link>
          </div>
          <div className="loket-split__media loket-split__media--stacked">
            <Image
              src="/castle.webp" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("home.en.images.primeLocationsCastleAlt")}
              width={560}
              height={420}
              className="loket-split__image loket-split__image--stacked"
            />
            <Image
              src="/tower.webp" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("home.en.images.primeLocationsTowerAlt")}
              width={560}
              height={420}
              className="loket-split__image loket-split__image--stacked"
            />
          </div>
        </section>
        <section className="loket-split loket-split--stacked">
          <div className="loket-split__text">
            <p className="loket-split__eyebrow">{translator("home.en.realEstateStoryTwo.eyebrow")}</p>
            <h2>{translator("home.en.realEstateStoryTwo.heading")}</h2>
            <p>{translator("home.en.realEstateStoryTwo.body")}</p>
            <Link href={localizedPath(lang, "realEstate")} className="loket-link primary">
              {translator("home.en.realEstateStory.cta")}
            </Link>
          </div>
          <div className="loket-split__media loket-split__media--pair">
            <Image
              src="/stepfree-listing-1.jpg" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("home.en.images.comfortTopAlt")}
              width={560}
              height={420}
              className="loket-split__image loket-split__image--paired"
            />
            <Image
              src="/stepfree-listing-2.jpg" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("home.en.images.comfortBottomAlt")}
              width={560}
              height={420}
              className="loket-split__image loket-split__image--paired"
            />
          </div>
        </section>
      </section>
    </div>
  );
}
