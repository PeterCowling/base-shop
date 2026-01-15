// Copied from src/components/accommodations-carousel/CarouselSlides.tsx
import { ArrowLeft, ArrowRight as ArrowRightIcon } from "lucide-react";
import { memo, useCallback, useEffect, useId, useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import type { SwiperProps, SwiperSlideProps } from "swiper/react";
import type { CarouselSlidesProps } from "./CarouselSlides.types";
import SlideItem from "../molecules/SlideItem";
import { Grid } from "@ui/components/atoms/primitives/Grid";
import { Section } from "../atoms/Section";

interface SwiperBundle {
  Swiper: ComponentType<SwiperProps>;
  SwiperSlide: ComponentType<SwiperSlideProps>;
}

function CarouselSlides({ roomsData, openModalForRate, lang }: CarouselSlidesProps): JSX.Element {
  const { t } = useTranslation("roomsPage", { lng: lang });
  const [swiperBundle, setSwiperBundle] = useState<SwiperBundle | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const navId = useId();

  // Load Swiper only when the carousel is visible or interacted with
  const ensureLoad = useCallback(() => setShouldLoad(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Intersection-based trigger
    const el = sectionRef.current;
    if (!el || shouldLoad) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.some((e) => e.isIntersecting);
      if (vis) {
        setShouldLoad(true);
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || typeof window === "undefined") return;
    (async () => {
      const [{ Swiper, SwiperSlide }, SwiperCore] = await Promise.all([
        import(/* @vite-prefetch */ "swiper/react"),
        import(/* @vite-prefetch */ "swiper"),
      ]);
      let NavigationMod: unknown;
      try {
        NavigationMod = (await import(/* @vite-prefetch */ "swiper/modules")).Navigation;
      } catch {
        // @ts-expect-error Swiper 9 export
        NavigationMod = (await import("swiper")).Navigation;
      }
      (SwiperCore as { default: typeof import("swiper").default }).default.use([NavigationMod as never]);
      setSwiperBundle({ Swiper, SwiperSlide });
    })();
  }, [shouldLoad]);

  const onSwiperInit = useCallback((sw: import("swiper").Swiper) => {
    setAtStart(sw.isBeginning);
    setAtEnd(sw.isEnd);
    sw.on("slideChange", () => {
      setAtStart(sw.isBeginning);
      setAtEnd(sw.isEnd);
    });
  }, []);

  const baseBtn =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "group hidden lg:inline-flex rounded-full p-3 shadow-md transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60 shrink-0 self-center";
  const leftBtn =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-bg/90 dark:bg-brand-surface/90 ring-1 ring-black/10 dark:ring-white/10 hover:bg-brand-primary/90 hover:text-white";
  const rightBtn =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "bg-brand-bg/90 dark:bg-brand-surface/90 ring-1 ring-black/10 dark:ring-white/10 hover:bg-brand-bougainvillea/90 hover:text-white";
  const iconCls =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-105";

  const hideArrows = !swiperBundle;

  const StaticList = (
    <Grid cols={1} gap={6} className="list-none auto-rows-fr sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {roomsData.map((room) => (
        <div key={room.id} className="flex">
          <SlideItem item={room} lang={lang} openModalForRate={openModalForRate} />
        </div>
      ))}
    </Grid>
  );

  let InteractiveCarousel: JSX.Element | null = null;
  if (swiperBundle) {
    const { Swiper, SwiperSlide } = swiperBundle;
    InteractiveCarousel = (
      <Swiper
        className="h-full w-full"
        spaceBetween={24}
        slidesPerView={1.15}
        breakpoints={{
          480: { slidesPerView: 1.35 },
          640: { slidesPerView: 1.6 },
          768: { slidesPerView: 1.9 },
          1024: { slidesPerView: 2.2 },
          1280: { slidesPerView: 2.8 },
          1536: { slidesPerView: 3.2 },
        }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(sw) => {
          sw.params.navigation = { ...(sw.params.navigation as object), prevEl: prevRef.current, nextEl: nextRef.current };
          onSwiperInit(sw);
        }}
      >
        {roomsData.map((room) => (
          <SwiperSlide key={room.id} className="flex h-full">
            <SlideItem item={room} lang={lang} openModalForRate={openModalForRate} />
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  return (
    <Section as="section" ref={sectionRef} padding="none" className="px-4 py-6 sm:py-8 cv-auto">
      <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
        <button
          ref={prevRef}
          aria-label={t("carousel.previousSlide")}
          disabled={atStart}
          onClick={ensureLoad}
          className={`${navId}-prev ${hideArrows ? "hidden" : ""} ${baseBtn} ${leftBtn}`}
        >
          <ArrowLeft className={iconCls} />
        </button>
        <div className="min-w-0 flex-1">
          {swiperBundle ? InteractiveCarousel : StaticList}
        </div>
        <button
          ref={nextRef}
          aria-label={t("carousel.nextSlide")}
          disabled={atEnd}
          onClick={ensureLoad}
          className={`${navId}-next ${hideArrows ? "hidden" : ""} ${baseBtn} ${rightBtn}`}
        >
          <ArrowRightIcon className={iconCls} />
        </button>
      </div>
    </Section>
  );
}

export { CarouselSlides };
export default memo(CarouselSlides);
