function isI18nKeyToken(value: string): boolean {
  if (!value.includes(".") || value.includes(" ")) return false;
  return value
    .split(".")
    .every((segment) => segment.length > 0 && /^[a-z0-9_]+$/i.test(segment));
}

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (isI18nKeyToken(trimmed)) return fallback;
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
