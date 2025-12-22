// i18n-exempt -- I18N-1234 [ttl=2026-12-31]

/**
 * Centralised lazy loaders keep module specifiers in one place while still
 * emitting static strings that Vite can analyse during import scanning. Using
 * plain string constants prevented Vite from rewriting the specifiers, which
 * in turn caused runtime failures when the browser attempted to resolve the
 * bare aliases. Exporting factory functions preserves the indirection while
 * remaining fully compatible with Vite's analyser.
 */
export const loadIntroTextBox = () =>
  import(
    /* i18n-exempt -- ROUTES-712 [ttl=2026-12-31] Module specifier required for bundler analysis */
    "@acme/ui/molecules/IntroTextBox"
  ).then((m) => ({ default: m.IntroTextBox }));

export const loadCarouselSlides = () =>
  import(
    /* i18n-exempt -- ROUTES-712 [ttl=2026-12-31] Module specifier required for bundler analysis */
    "@acme/ui/organisms/CarouselSlides"
  );

export const loadDestinationSlideshow = () =>
  import(
    /* i18n-exempt -- ROUTES-712 [ttl=2026-12-31] Module specifier required for bundler analysis */
    "@acme/ui/molecules/Highlights"
  ).then((m) => ({ default: m.default }));
