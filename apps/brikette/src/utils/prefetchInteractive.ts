/* src/utils/prefetchInteractive.ts */
/* -------------------------------------------------------------------------- */
/*  Prefetch interactive bundles to improve Time to Interactive                */
/* -------------------------------------------------------------------------- */

/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] module specifiers are not user-facing */
type NavigatorConnection = {
  saveData?: boolean;
  effectiveType?: string;
};

const getConnection = (): NavigatorConnection | undefined => {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as typeof navigator & { connection?: NavigatorConnection }).connection;
};

const isSlowConnection = (connection: NavigatorConnection | undefined): boolean => {
  const effectiveType = connection?.effectiveType ?? "";
  return effectiveType === "slow-2g" || effectiveType === "2g";
};

export const shouldPrefetchInteractiveBundles = (): boolean => {
  if (typeof window === "undefined") return false;
  const connection = getConnection();
  if (connection?.saveData) return false;
  if (isSlowConnection(connection)) return false;
  return true;
};

const ROOMS_BOOKING_SLUGS = new Set<string>([
  // rooms
  "rooms",
  "zimmer",
  "habitaciones",
  "chambres",
  "camere",
  "quartos",
  "komnaty",
  "fangjian",
  "heya",
  "bang",
  "ghuraf",
  "kamare",
  "phong",
  "pokoje",
  "rum",
  "rom",
  "vaerelser",
  "szobak",
  // book
  "book",
  "buchen",
  "reservar",
  "reserver",
  "prenota",
  "bronirovanie",
  "yuding",
  "yoyaku",
  "yeyak",
  "hajz",
  "dat-phong",
  "rezerwuj",
  "boka",
  "bestill",
  "foglalas",
  // Some locales reuse English for "book" (keep explicit for clarity)
  "book",
]);

const getSecondPathSegment = (pathname: string): string | undefined => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return undefined;
  return segments[1];
};

export const shouldPrefetchInteractiveBundlesOnIdle = (pathname: string): boolean => {
  const second = getSecondPathSegment(pathname);
  if (!second) return false;
  return ROOMS_BOOKING_SLUGS.has(second);
};

let prefetchStarted = false;

const importInteractiveBundles = async (): Promise<void> => {
  await import(/* webpackPrefetch: true */ "swiper");
  await import(/* webpackPrefetch: true */ "swiper/react");
  await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/BookingModal");
  await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/BookingModal2");
  await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/LocationModal");
  await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/ContactModal");
  await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/OffersModal");
  await import(/* webpackPrefetch: true */ "@acme/ui/organisms/modals/FacilitiesModal");
};

export async function prefetchInteractiveBundlesNow(): Promise<void> {
  if (!shouldPrefetchInteractiveBundles()) return;
  if (prefetchStarted) return;
  prefetchStarted = true;
  await importInteractiveBundles();
}

export default function prefetchInteractiveBundles(): Promise<void> | void {
  if (typeof window === "undefined") return;
  if (!shouldPrefetchInteractiveBundles()) return;
  if (prefetchStarted) return;
  prefetchStarted = true;

  const ric = (
    window as typeof window & {
      requestIdleCallback?: (cb: () => void) => void;
    }
  ).requestIdleCallback;

  if (ric) {
    return new Promise((resolve) => {
      ric(() => {
        void importInteractiveBundles().then(resolve);
      });
    });
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      void importInteractiveBundles().then(resolve);
    }, 2000);
  });
}
