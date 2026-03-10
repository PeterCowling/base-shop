import { I18N_KEY_TOKEN_PATTERN } from "@/utils/i18nContent";

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}

type TranslationFn = (key: string, options?: Record<string, unknown>) => unknown;

function resolveAcrossTranslators(
  translators: readonly TranslationFn[],
  key: string,
  fallback: string,
): string {
  for (const translate of translators) {
    const resolved = resolveTranslatedCopy(translate(key), "");
    if (resolved) return resolved;
  }

  return fallback;
}

export function resolveBookingControlLabels(
  ...translators: TranslationFn[]
): {
  decreaseGuestsAriaLabel: string;
  increaseGuestsAriaLabel: string;
} {
  const activeTranslators = translators.length > 0 ? translators : [() => ""];
  const decreaseAdults = resolveAcrossTranslators(
    activeTranslators,
    "bookingControls.decreaseAdults",
    "Decrease guests", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] shared fallback label
  );
  const increaseAdults = resolveAcrossTranslators(
    activeTranslators,
    "bookingControls.increaseAdults",
    "Increase guests", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] shared fallback label
  );

  return {
    decreaseGuestsAriaLabel: resolveAcrossTranslators(
      activeTranslators,
      "bookingControls.decreaseGuests",
      decreaseAdults,
    ),
    increaseGuestsAriaLabel: resolveAcrossTranslators(
      activeTranslators,
      "bookingControls.increaseGuests",
      increaseAdults,
    ),
  };
}
