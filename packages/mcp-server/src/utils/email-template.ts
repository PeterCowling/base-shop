/* eslint-disable ds/no-raw-color, ds/no-raw-font */
/**
 * HTML Email Template for Brikette Draft Responses
 *
 * Generates branded HTML emails matching Brikette's visual identity.
 * Used by gmail_create_draft tool to create professional-looking responses.
 */
/**
 * Brikette brand colors
 */
const COLORS = {
  primary: "#1e3a5f", // Deep blue - header/footer
  secondary: "#3b82f6", // Bright blue - links/accents
  background: "#f8fafc", // Light gray background
  white: "#ffffff",
  text: "#1f2937", // Dark gray text
  textLight: "#6b7280", // Light gray text
  border: "#e5e7eb", // Border color
} as const;

/**
 * Email template options
 */
export interface EmailTemplateOptions {
  /** Recipient's name (for greeting) */
  recipientName?: string;
  /** Email body content (plain text - will be converted to paragraphs) */
  bodyText: string;
  /** Optional: Include booking link CTA */
  includeBookingLink?: boolean;
  /** Optional: Custom subject for preview text */
  subject?: string;
}

/**
 * Generate branded HTML email for Brikette responses
 *
 * @param options - Email content options
 * @returns Complete HTML email string
 *
 * @example
 * ```ts
 * const html = generateEmailHtml({
 *   recipientName: "Maria",
 *   bodyText: "Thank you for your inquiry...",
 *   includeBookingLink: true,
 * });
 * ```
 */
export function generateEmailHtml(options: EmailTemplateOptions): string {
  const { recipientName, bodyText, includeBookingLink = false, subject } = options;

  // Convert plain text to HTML paragraphs
  const bodyHtml = textToHtmlParagraphs(bodyText);

  // Generate greeting
  const greeting = recipientName
    ? `Dear ${recipientName},`
    : "Dear Guest,";

  // Generate booking CTA if requested
  const bookingCta = includeBookingLink
    ? `
      <tr>
        <td style="padding: 20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="border-radius: 6px; background-color: ${COLORS.secondary};">
                <a href="https://hostelbrikette.com/book" target="_blank" style="border: solid 1px ${COLORS.secondary}; border-radius: 6px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; background-color: ${COLORS.secondary}; color: ${COLORS.white};">Book Direct &amp; Save</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject || "Hostel Brikette"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 15px !important; }
    }
  </style>
</head>
<body style="background-color: ${COLORS.background}; margin: 0 !important; padding: 0 !important;">

<!-- Wrapper Table -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.background};">
  <tr>
    <td align="center" style="padding: 20px 10px;">

      <!-- Email Container -->
      <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="background-color: ${COLORS.primary}; padding: 25px 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: ${COLORS.white}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: 1px;">
              HOSTEL BRIKETTE
            </h1>
            <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.8); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 2px;">
              POSITANO • AMALFI COAST
            </p>
          </td>
        </tr>

        <!-- Body Content -->
        <tr>
          <td class="mobile-padding" style="background-color: ${COLORS.white}; padding: 35px 40px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">

              <!-- Greeting -->
              <tr>
                <td style="padding-bottom: 20px;">
                  <p style="margin: 0; color: ${COLORS.text}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6;">
                    ${greeting}
                  </p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="color: ${COLORS.text}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7;">
                  ${bodyHtml}
                </td>
              </tr>

              <!-- Booking CTA -->
              ${bookingCta}

              <!-- Signature -->
              <tr>
                <td style="padding-top: 25px; border-top: 1px solid ${COLORS.border}; margin-top: 25px;">
                  <p style="margin: 0 0 5px 0; color: ${COLORS.text}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6;">
                    Warm regards,
                  </p>
                  <p style="margin: 0; color: ${COLORS.primary}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600;">
                    Peter &amp; Cristiana
                  </p>
                  <p style="margin: 3px 0 0 0; color: ${COLORS.textLight}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px;">
                    Hostel Brikette
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: ${COLORS.primary}; padding: 25px 20px; border-radius: 0 0 8px 8px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">

              <!-- Contact Info -->
              <tr>
                <td align="center" style="padding-bottom: 15px;">
                  <p style="margin: 0; color: rgba(255,255,255,0.9); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6;">
                    Via Guglielmo Marconi, 358 • 84017 Positano (SA) • Italy
                  </p>
                  <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px;">
                    <a href="tel:+39089875857" style="color: rgba(255,255,255,0.9); text-decoration: none;">+39 089 875857</a>
                    &nbsp;•&nbsp;
                    <a href="mailto:info@hostelbrikette.com" style="color: rgba(255,255,255,0.9); text-decoration: none;">info@hostelbrikette.com</a>
                  </p>
                </td>
              </tr>

              <!-- Social Links -->
              <tr>
                <td align="center" style="padding-bottom: 15px;">
                  <a href="https://www.instagram.com/hostelbrikette/" target="_blank" style="color: rgba(255,255,255,0.8); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; text-decoration: none; margin: 0 10px;">Instagram</a>
                  <a href="https://www.facebook.com/hostelbrikette/" target="_blank" style="color: rgba(255,255,255,0.8); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; text-decoration: none; margin: 0 10px;">Facebook</a>
                  <a href="https://hostelbrikette.com" target="_blank" style="color: rgba(255,255,255,0.8); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; text-decoration: none; margin: 0 10px;">Website</a>
                </td>
              </tr>

              <!-- Legal -->
              <tr>
                <td align="center">
                  <p style="margin: 0; color: rgba(255,255,255,0.5); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px;">
                    © ${new Date().getFullYear()} Hostel Brikette. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/**
 * Convert plain text to HTML paragraphs
 * Handles line breaks and basic formatting
 */
function textToHtmlParagraphs(text: string): string {
  // Split on double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);

  return paragraphs
    .map((para) => {
      // Convert single newlines to <br>
      const withBreaks = para.trim().replace(/\n/g, "<br>");

      // Convert **bold** to <strong>
      const withBold = withBreaks.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

      // Convert URLs to links
      const withLinks = withBold.replace(
        /(https?:\/\/[^\s<]+)/g,
        `<a href="$1" style="color: ${COLORS.secondary}; text-decoration: underline;">$1</a>`
      );

      return `<p style="margin: 0 0 15px 0;">${withLinks}</p>`;
    })
    .join("\n");
}

/**
 * Extract recipient name from email address or full name
 * "John Smith <john@example.com>" -> "John"
 * "john@example.com" -> null (use default greeting)
 */
export function extractRecipientName(from: string): string | undefined {
  // Try to extract name from "Name <email>" format
  const nameMatch = from.match(/^([^<]+)</);
  if (nameMatch) {
    const fullName = nameMatch[1].trim().replace(/"/g, "");
    // Return first name only
    const firstName = fullName.split(/\s+/)[0];
    if (firstName && firstName.length > 1 && !firstName.includes("@")) {
      return firstName;
    }
  }
  return undefined;
}
