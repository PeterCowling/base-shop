/**
 * GA4 Consent Mode v2 + gtag initialization script content.
 *
 * Generates the inline <script> content that must appear in <head>
 * BEFORE gtag.js loads. Order:
 *   1. dataLayer + gtag function definition
 *   2. Consent Mode v2 defaults (deny all for EEA by default)
 *   3. gtag('js', new Date())
 *   4. gtag('config', measurementId)
 */

export interface ConsentScriptOptions {
  measurementId: string;
  /** When true, adds traffic_type: "internal" to gtag config */
  isInternalTraffic?: boolean;
}

/**
 * Generate the inline GA4 script content for <head>.
 *
 * Consent Mode v2 defaults deny all consent categories by default.
 * This is GDPR-compliant for EEA visitors — Google will use
 * conversion modeling for denied-consent users.
 *
 * The cookie consent banner (GA4-04) calls gtag('consent', 'update', ...)
 * when the user grants consent.
 */
export function buildGA4InlineScript(opts: ConsentScriptOptions): string {
  const { measurementId, isInternalTraffic } = opts;

  const configParams = isInternalTraffic
    ? `{ traffic_type: 'internal' }`
    : undefined;

  return [
    // 1. dataLayer + gtag function
    `window.dataLayer = window.dataLayer || [];`,
    `function gtag(){dataLayer.push(arguments);}`,
    ``,
    // 2. Consent Mode v2 defaults — deny all by default (GDPR-safe)
    `gtag('consent', 'default', {`,
    `  ad_storage: 'denied',`,
    `  ad_user_data: 'denied',`,
    `  ad_personalization: 'denied',`,
    `  analytics_storage: 'denied',`,
    `  wait_for_update: 500`,
    `});`,
    ``,
    // 3. gtag('js', ...)
    `gtag('js', new Date());`,
    ``,
    // 4. gtag('config', measurementId)
    configParams
      ? `gtag('config', '${measurementId}', ${configParams});`
      : `gtag('config', '${measurementId}');`,
  ].join("\n");
}
