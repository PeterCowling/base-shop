// packages/ui/src/organisms/DestinationSlideshow.tsx
import { FC, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CfHeroImage } from "@/atoms/CfHeroImage";
import { Section } from "@/atoms/Section";
import { Grid } from "@/components/atoms/primitives/Grid";
import { Heading } from "../atoms/Typography";

const IMG = {
  terraceLush: "/img/hostel-communal-terrace-lush-view.webp",
  bambooCanopy: "/img/hostel-terrace-bamboo-canopy.webp",
  coastalHorizon: "/img/hostel-coastal-horizon.webp",
} as const;

interface Slide {
  title: string;
  text: string;
  image: string;
  alt: string;
}

const DestinationSlideshow: FC<{ lang?: string }> = ({ lang }) => {
  const { t, ready } = useTranslation("landingPage", { lng: lang });

  const slides: Slide[] = useMemo(() => {
    if (!ready) return [];
    return [
      {
        title: t("destinationSlideshow.slides.0.title"),
        text: t("destinationSlideshow.slides.0.text"),
        alt: t("destinationSlideshow.slides.0.alt"),
        image: IMG.terraceLush,
      },
      {
        title: t("destinationSlideshow.slides.1.title"),
        text: t("destinationSlideshow.slides.1.text"),
        alt: t("destinationSlideshow.slides.1.alt"),
        image: IMG.bambooCanopy,
      },
      {
        title: t("destinationSlideshow.slides.2.title"),
        text: t("destinationSlideshow.slides.2.text"),
        alt: t("destinationSlideshow.slides.2.alt"),
        image: IMG.coastalHorizon,
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
          <div className="relative aspect-[var(--destination-slideshow-aspect,4/3)] w-full overflow-hidden">
            <CfHeroImage
              src={image}
              alt={alt}
              quality={80}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>

          <figcaption className="relative mt-0 flex w-full justify-center bg-black/55 px-6 py-6 text-center backdrop-blur-sm sm:px-8 sm:py-8 after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/40 after:to-transparent dark:bg-black/60">
            <Section
              as="div"
              padding="none"
              width="full"
              className="relative z-10 flex w-full max-w-md flex-col items-center justify-center"
            >
              <h3 className="text-xl font-semibold leading-snug text-white dark:text-white md:text-2xl">{title}</h3>
              <p className="mt-2 text-sm text-white/90 dark:text-white/90 md:text-base">{text}</p>
            </Section>
          </figcaption>
        </figure>
      )),
    [slides]
  );

  return (
    <section className="bg-brand-surface py-8 dark:bg-brand-text lg:py-12 cv-auto">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <Heading level={2} align="center" className="mb-8 text-brand-heading dark:text-brand-surface">
          {t("destinationSlideshow.sectionTitle")}
        </Heading>

        <Grid cols={1} gap={8}>
          {slideFigures}
        </Grid>
      </Section>
    </section>
  );
};

export default memo(DestinationSlideshow);
export { DestinationSlideshow };
