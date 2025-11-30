// apps/cover-me-pretty/src/types/not-found.ts

/**
 * Shape of the messages displayed on the Not Found pages.
 *
 * Having a dedicated type allows the UI component to remain explicitly
 * typed without resorting to `any`.  Should the wording ever become
 * dynamic (for example, when pulling translations from an API), this
 * contract will make it easy to identify the required fields.
 */
export interface NotFoundMessages {
  /**
   * Headline shown to the visitor when a page cannot be located.
   */
  readonly title: string;
  /**
   * Additional description explaining why the page is missing.
   */
  readonly description: string;
  /**
   * Label used for the call‑to‑action link back to the home page.
   */
  readonly cta: string;
}
