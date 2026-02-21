// src/utils/trackThenNavigate.ts
// Outbound-reliable GA4 event helper for same-tab navigation links.
//
// Caller contract for outbound <a> elements
// ─────────────────────────────────────────
// shouldInterceptClick guard — only intercept when ALL of:
//   e.button === 0  AND  !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey  AND  target !== "_blank"
// If the guard fails, do NOT call e.preventDefault() — let the browser handle Cmd/Ctrl-click normally.
// When the guard passes:
//   1. Caller calls e.preventDefault().
//   2. Caller calls trackThenNavigate(eventName, params, () => window.location.assign(href)).
// Double-click deduplication: caller sets an isNavigating flag (React ref or state) and ignores
// subsequent clicks until navigation completes.

type GTag = (...args: unknown[]) => void;

function getGtag(): GTag | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as Window & { gtag?: GTag }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

/**
 * Fires a GA4 event with beacon transport, then calls `navigate` once.
 *
 * The function guarantees `navigate` is called exactly once regardless of
 * whether gtag is present, whether the event_callback fires, or whether
 * the fallback timeout expires first.
 *
 * @param eventName  - GA4 event name, passed as the second argument to gtag("event", ...).
 * @param params     - Arbitrary event parameters merged into the gtag payload.
 * @param navigate   - Navigation callback (e.g. () => window.location.assign(href)).
 *                     Called at most once.
 * @param timeoutMs  - Maximum milliseconds to wait for the GA4 beacon to be
 *                     dispatched before calling navigate anyway.
 *                     Default: 200.
 *
 * 200ms timeout rationale: empirically-established UX trade-off — short enough
 * to feel near-instant to the user, long enough for most browsers to dispatch
 * the navigator.sendBeacon payload before the page unloads.
 *
 * Null-gtag behaviour: when window.gtag is absent (e.g. ad blockers, SSR, or
 * before the GA4 snippet loads) navigate is called immediately so no hang occurs.
 */
export function trackThenNavigate(
  eventName: string,
  params: Record<string, unknown>,
  navigate: () => void,
  timeoutMs: number = 200,
): void {
  const gtag = getGtag();

  if (!gtag) {
    navigate();
    return;
  }

  let navigated = false;
  const go = (): void => {
    if (navigated) return;
    navigated = true;
    navigate();
  };

  const timer = window.setTimeout(go, timeoutMs);

  gtag("event", eventName, {
    ...params,
    transport_type: "beacon",
    event_callback: (): void => {
      window.clearTimeout(timer);
      go();
    },
  });
}
