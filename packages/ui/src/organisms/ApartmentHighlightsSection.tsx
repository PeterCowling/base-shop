// packages/ui/src/organisms/ApartmentHighlightsSection.tsx
import { CfHeroImage } from "@ui/atoms/CfHeroImage";
import { memo, useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import { Section } from "../atoms/Section";
import { Grid } from "@ui/components/atoms/primitives/Grid";

const IMAGES = {
  slide1: "/img/positano-panorama.avif",
  slide2: "/img/free-perks.avif",
  slide3: "/img/facade.avif",
} as const;

interface Slide {
  title: string;
  text: string;
  alt: string;
  image: string;
}

const ApartmentHighlightsSection: FC<{ lang?: string }> = ({ lang }) => {
  const { t, ready } = useTranslation("apartmentPage", { lng: lang });

  const slides: Slide[] = useMemo(() => {
    if (!ready) return [];
    return [
      {
        title: t("highlights.slides.0.title"),
        text: t("highlights.slides.0.text"),
        alt: t("highlights.slides.0.alt"),
        image: IMAGES.slide1,
      },
      {
        title: t("highlights.slides.1.title"),
        text: t("highlights.slides.1.text"),
        alt: t("highlights.slides.1.alt"),
        image: IMAGES.slide2,
      },
      {
        title: t("highlights.slides.2.title"),
        text: t("highlights.slides.2.text"),
        alt: t("highlights.slides.2.alt"),
        image: IMAGES.slide3,
      },
    ];
  }, [t, ready]);

  const slideFigures = useMemo(
    () =>
      slides.map(({ title, text, image, alt }) => (
        <figure
          key={title}
          className="group flex w-full flex-col overflow-hidden rounded-3xl shadow-xl transition-shadow duration-300 hover:shadow-2xl"
        >
          <div className="relative aspect-[var(--apartment-highlight-aspect,4/3)] w-full overflow-hidden">
            <CfHeroImage
              src={image}
              alt={alt}
              quality={80}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
          <figcaption className="relative mt-0 flex w-full justify-center bg-black/55 px-6 py-6 text-center backdrop-blur-sm sm:px-8 sm:py-8 after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/40 after:to-transparent dark:bg-black/60">
            <div className="relative z-10 flex w-full flex-col items-center justify-center">
              <h3 className="text-xl font-semibold leading-snug text-white dark:text-white md:text-2xl">{title}</h3>
              <p className="mt-2 text-sm text-white/90 dark:text-white/90 md:text-base">{text}</p>
            </div>
          </figcaption>
        </figure>
      )),
    [slides]
  );

  return (
    <section className="bg-brand-surface py-8 dark:bg-brand-text lg:py-12">
      <Section as="div" padding="none" className="max-w-6xl px-4">
        <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-brand-heading dark:text-brand-surface">{t("highlights.sectionTitle")}</h2>
        <Grid cols={1} gap={8}>{slideFigures}</Grid>
      </Section>
    </section>
  );
};

export default memo(ApartmentHighlightsSection);
export { ApartmentHighlightsSection };
