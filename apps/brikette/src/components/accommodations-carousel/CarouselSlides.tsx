// src/components/accommodations-carousel/CarouselSlides.tsx
/* ────────────────────────────────────────────────────────────────
   Room carousel – Static grid fallback + Swiper variant
---------------------------------------------------------------- */
import { type ComponentType,memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight as ArrowRightIcon } from "lucide-react";
import type { SwiperProps, SwiperSlideProps } from "swiper/react";

import { Grid } from "@acme/ui/atoms";
import { Section } from "@acme/ui/atoms";

import type { CarouselSlidesProps } from "./CarouselSlides.types";
import SlideItem from "./SlideItem";

/* ------------------------------------------------------------------ */
/*  Dynamic Swiper import – browser‑only                              */
/* ------------------------------------------------------------------ */
interface SwiperBundle {
  Swiper: ComponentType<SwiperProps>;
  SwiperSlide: ComponentType<SwiperSlideProps>;
}

function CarouselSlides({ roomsData, openModalForRate, lang }: CarouselSlidesProps): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t, i18n, ready } = useTranslation("roomsPage", translationOptions);
  const activeLanguage = lang ?? i18n.language;
  const hasBundle = i18n.hasResourceBundle(activeLanguage, "roomsPage");
  if (!ready || !hasBundle) {
    return <></>;
  }

  /* ------------------------- state & refs ------------------------- */
  const [swiperBundle, setSwiperBundle] = useState<SwiperBundle | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  // removed custom classnames for prev/next; Swiper refs handle navigation
  const slideNodesRef = useRef<Record<string, HTMLElement | null>>({});
  const slideRefCallbacks = useRef<Record<string, (node: HTMLElement | null) => void>>({});
  const measureRafIdRef = useRef<number | null>(null);

  /* -------------- lazy‑load Swiper (only in browser) -------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      const cssImport = import("swiper/css").catch(() => undefined);
      const [{ Swiper, SwiperSlide }, SwiperCore] = await Promise.all([
        import(/* webpackPrefetch: true */ "swiper/react"),
        import(/* webpackPrefetch: true */ "swiper"),
      ]);

      /* module detection for both Swiper 9 and 10 */
      let NavigationMod: unknown;
      try {
        NavigationMod = (await import(/* webpackPrefetch: true */ "swiper/modules")).Navigation;
      } catch {
        // @ts-expect-error – Swiper 9 exports Navigation from root
        NavigationMod = (await import("swiper")).Navigation;
      }

      (
        SwiperCore as {
          default: typeof import("swiper").default;
        }
      ).default.use([NavigationMod].filter(Boolean) as never[]);

      setSwiperBundle({ Swiper, SwiperSlide });
      await cssImport;
    })();
  }, []);

  const measureSlideHeights = useCallback(() => {
    const nodes = roomsData
      .map((room) => slideNodesRef.current[room.id])
      .filter((node): node is HTMLElement => Boolean(node));

    if (nodes.length !== roomsData.length) return;

    const nextHeight = nodes.reduce((max, node) => Math.max(max, node.offsetHeight), 0);
    setCardHeight(nextHeight > 0 ? nextHeight : undefined);
  }, [roomsData]);

  const scheduleHeightMeasure = useCallback(() => {
    if (typeof window === "undefined") return;
    if (measureRafIdRef.current !== null) {
      window.cancelAnimationFrame(measureRafIdRef.current);
    }
    measureRafIdRef.current = window.requestAnimationFrame(() => {
      measureRafIdRef.current = null;
      measureSlideHeights();
    });
  }, [measureSlideHeights]);

  useEffect(() => {
    scheduleHeightMeasure();
    return () => {
      if (measureRafIdRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(measureRafIdRef.current);
      }
    };
  }, [scheduleHeightMeasure, swiperBundle]);

  const getSlideRef = useCallback(
    (roomId: string) => {
      const cached = slideRefCallbacks.current[roomId];
      if (cached) return cached;
      const refCallback = (node: HTMLElement | null) => {
        slideNodesRef.current[roomId] = node;
        if (node) scheduleHeightMeasure();
      };
      slideRefCallbacks.current[roomId] = refCallback;
      return refCallback;
    },
    [scheduleHeightMeasure]
  );

  /* Swiper event hook */
  const onSwiperInit = useCallback((sw: import("swiper").Swiper) => {
    setAtStart(sw.isBeginning);
    setAtEnd(sw.isEnd);
    sw.on("slideChange", () => {
      setAtStart(sw.isBeginning);
      setAtEnd(sw.isEnd);
    });
  }, []);

  /* ---------------------- styles & helpers ------------------------ */
  const combineClasses = (
    ...classes: Array<string | false | null | undefined>
  ): string => classes.filter(Boolean).join(" ");

  const baseBtn = combineClasses(
    "group",
    "inline-flex",
    "rounded-full",
    "p-3",
    "shadow-md",
    "transition-colors",
    "duration-300",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-brand-primary",
    "disabled:cursor-not-allowed",
    "disabled:opacity-60",
    "shrink-0",
    "self-center",
    "rooms-carousel-nav"
  );

  const leftBtn = combineClasses(
    "bg-brand-bg/90",
    "dark:bg-brand-surface/90",
    "ring-1",
    "ring-brand-outline/10",
    "dark:ring-brand-outline/10",
    "hover:bg-brand-primary/90",
    "hover:text-brand-bg"
  );
  const rightBtn = combineClasses(
    "bg-brand-bg/90",
    "dark:bg-brand-surface/90",
    "ring-1",
    "ring-brand-outline/10",
    "dark:ring-brand-outline/10",
    "hover:bg-brand-bougainvillea/90",
    "hover:text-brand-bg"
  );
  const iconCls = combineClasses(
    "h-5",
    "w-5",
    "shrink-0",
    "transition-transform",
    "duration-300",
    "group-hover:scale-105"
  );

  const hideArrows = !swiperBundle;

  const heightProps = cardHeight !== undefined ? { height: cardHeight } : {};

  /* --------------------------- fallback grid ---------------------- */
  const StaticList = (
    <Grid
      as="ul"
      className="list-none"
      columns={{ base: 1, sm: 2, lg: 3, "2xl": 4 }}
      gap={6}
    >
      {roomsData.map((room) => (
        <li key={room.id} className="flex">
          <SlideItem
            ref={getSlideRef(room.id)}
            item={room}
            openModalForRate={openModalForRate}
            {...heightProps}
            {...(lang !== undefined ? { lang } : {})}
          />
        </li>
      ))}
      </Grid>
    );

  /* --------------------------- Swiper UI -------------------------- */
  let InteractiveCarousel: JSX.Element | null = null;
  if (swiperBundle) {
    const { Swiper, SwiperSlide } = swiperBundle;
    InteractiveCarousel = (
      <Swiper
        className="size-full"
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
          sw.params.navigation = {
            ...(sw.params.navigation as object),
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          };
          onSwiperInit(sw);
        }}
      >
        {roomsData.map((room) => (
          <SwiperSlide key={room.id} className="flex h-full">
            <SlideItem
              ref={getSlideRef(room.id)}
              item={room}
              openModalForRate={openModalForRate}
              {...heightProps}
              {...(lang !== undefined ? { lang } : {})}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  /* ----------------------------- render --------------------------- */
  return (
    <Section padding="none" className="px-4 py-6 sm:py-8">
      <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
        {/* Prev arrow */}
        <button
          ref={prevRef}
          aria-label={t("carousel.previousSlide")}
          disabled={atStart}
          className={combineClasses(
            hideArrows && "hidden",
            "order-1",
            baseBtn,
            leftBtn
          )}
        >
          <ArrowLeft className={iconCls} />
        </button>

        {/* Next arrow – rendered before carousel in DOM to keep tab order intuitive */}
        <button
          ref={nextRef}
          aria-label={t("carousel.nextSlide")}
          disabled={atEnd}
          className={combineClasses(
            hideArrows && "hidden",
            "order-3",
            baseBtn,
            rightBtn
          )}
        >
          <ArrowRightIcon className={iconCls} />
        </button>

        {/* Content */}
        <div className="order-2 min-w-0 flex-1">
          {swiperBundle ? InteractiveCarousel : StaticList}
        </div>
      </div>
    </Section>
  );
}

export default memo(CarouselSlides);
