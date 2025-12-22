/* src/utils/prefetchInteractive.ts */
/* -------------------------------------------------------------------------- */
/*  Prefetch interactive bundles to improve Time to Interactive                */
/* -------------------------------------------------------------------------- */

/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] module specifiers are not user-facing */
export default function prefetchInteractiveBundles(): Promise<void> | void {
  if (typeof window === "undefined") return;

  const prefetch = async () => {
    await import(/* webpackPrefetch: true */ "swiper");
    await import(/* webpackPrefetch: true */ "swiper/react");
    await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/BookingModal");
    await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/BookingModal2");
    await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/LocationModal");
    await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/ContactModal");
    await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/OffersModal");
    await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/FacilitiesModal");
  };

  const ric = (
    window as typeof window & {
      requestIdleCallback?: (cb: () => void) => void;
    }
  ).requestIdleCallback;

  if (ric) {
    return new Promise((resolve) => {
      ric(() => {
        void prefetch().then(resolve);
      });
    });
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      void prefetch().then(resolve);
    }, 2000);
  });
}
