/* eslint-disable ds/no-raw-color, ds/no-raw-font -- BRIK-ENG-0020 */
/**
 * HTML Email Template for Brikette Draft Responses
 *
 * Ported from GAS `_EmailsConfig.gs` to match branded formatting,
 * dual signatures, AVIF fallbacks, and social footer.
 */

const EMAIL_CONFIG = {
  hostelUrl: "http://www.hostel-positano.com",
  instagramUrl: "https://www.instagram.com/brikettepositano/",
  tiktokUrl: "https://www.tiktok.com/tag/hostelbrikettepositano",
  termsUrl:
    "https://docs.google.com/document/d/1d1nZUJfYQ22eOAqwL2C49BQbDRAAVAQaEZ9n-SGPKd4/edit?usp=sharing",
  images: {
    signatures: {
      cristianaPng: "https://drive.google.com/uc?export=view&id=1rui6txmiCVQyjHjeeIy2mhBkVy8SUWoT",
      cristianaAvif: "https://drive.google.com/uc?export=view&id=1Feprulv2wdfEPdLSvt4gNbqBuwQV-2pE",
      peterPng: "https://drive.google.com/uc?export=view&id=1I5JmosQCGJaZ8IhelaIMHGoRajdggRAv",
      peterAvif: "https://drive.google.com/uc?export=view&id=1DaBrFp7xGwS7TKa9HJJ775hPPrNNHNb6",
    },
    hostelIcon: {
      png: "https://drive.google.com/uc?export=view&id=10tnNnRPv_Pkyd8Dpi0ZmA7wQuJbqyMxs",
      avif: "https://drive.google.com/uc?export=view&id=1GRga7agHHKy8e_qaGdMIDi8k9GvEyAaM",
    },
    instagram: {
      png: "https://drive.google.com/uc?export=view&id=162ppeYFiCYJHi0r7kWvMlTDoF55EW2nL",
      avif: "https://drive.google.com/uc?export=view&id=1fzjT7Y37yxnGfHlPHy0raFjRulbD4FL-",
    },
    tiktok: {
      png: "https://drive.google.com/uc?export=view&id=1UPQrHmjzT9eueAWBunLVy27oo6YJFzsu",
      avif: "https://drive.google.com/uc?export=view&id=1n7n3drroYmhBW4NK92Gc_yT0Jc1m1tNH",
    },
  },
  colors: {
    header: "#ffc107",
    main: "#fff3cd",
    signature: "#ffeeba",
    footer: "#fff3cd",
    text: "#856404",
    white: "#ffffff",
    link: "#000000",
  },
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

function pictureHtml(
  avifUrl: string,
  pngUrl: string,
  altText: string,
  style: string
): string {
  return `
    <picture>
      <source srcset="${avifUrl}" type="image/avif">
      <source srcset="${pngUrl}" type="image/png">
      <img src="${pngUrl}" alt="${altText}" style="${style}" border="0">
    </picture>
  `;
}

/**
 * Generate branded HTML email for Brikette responses
 */
export function generateEmailHtml(options: EmailTemplateOptions): string {
  const { recipientName, bodyText, includeBookingLink = false, subject } = options;
  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Guest,";
  const bodyHtml = textToHtmlParagraphs(bodyText);
  const { colors } = EMAIL_CONFIG;

  const bookingCta = includeBookingLink
    ? `
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="${colors.header}" style="border-radius: 4px;">
                <a href="https://hostelbrikette.com/book" target="_blank" style="display: inline-block; padding: 12px 20px; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: ${colors.link}; text-decoration: none;">Book Direct &amp; Save</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
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
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.white};">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.white};">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 100%; max-width: 600px;">
          <tr>
            <td style="background-color: ${colors.header}; padding: 30px 25px 0 25px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="font-family: Arial, sans-serif; color: ${colors.white};">
                    <p style="margin: 0; font-size: 24px; font-weight: bold;">Hostel Bri&#8203;kett&#101;</p>
                    <p style="margin: 0; font-size: 20px; font-weight: bold;">Positano</p>
                  </td>
                  <td align="right" style="width: 80px;">
                    <a href="${EMAIL_CONFIG.hostelUrl}" style="text-decoration: none;">
                      ${pictureHtml(
                        EMAIL_CONFIG.images.hostelIcon.avif,
                        EMAIL_CONFIG.images.hostelIcon.png,
                        "Hostel Icon",
                        "width: 50px; height: auto; display: block;"
                      )}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: ${colors.main}; color: ${colors.text}; padding: 20px 30px 30px 30px; font-family: Arial, sans-serif;">
              <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.5;">${greeting}</p>
              <div style="font-size: 15px; line-height: 1.5;">
                ${bodyHtml}
              </div>
              ${bookingCta}
            </td>
          </tr>

          <tr>
            <td style="background-color: ${colors.signature}; padding: 20px 30px 30px 30px; font-family: Arial, sans-serif;">
              <p style="margin: 0 0 15px 0; text-align: center; font-size: 14px;">With warm regards,</p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="width: 50%;">
                    ${pictureHtml(
                      EMAIL_CONFIG.images.signatures.cristianaAvif,
                      EMAIL_CONFIG.images.signatures.cristianaPng,
                      "Cristiana's Signature",
                      "width: 200px; height: auto;"
                    )}
                    <div style="font-size: 14px;">Cristiana Marzano Cowling</div>
                    <div style="font-size: 12px;">Owner</div>
                  </td>
                  <td align="center" style="width: 50%;">
                    ${pictureHtml(
                      EMAIL_CONFIG.images.signatures.peterAvif,
                      EMAIL_CONFIG.images.signatures.peterPng,
                      "Peter's Signature",
                      "width: 200px; height: auto;"
                    )}
                    <div style="font-size: 14px;">Peter Cowling</div>
                    <div style="font-size: 12px;">Owner</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: ${colors.footer}; padding: 30px; font-family: Arial, sans-serif; color: ${colors.link};">
              <p style="margin: 0 0 10px 0; font-size: 13px;">Book directly for exclusive benefits. <a href="${EMAIL_CONFIG.termsUrl}" style="color: ${colors.link}; text-decoration: underline;">Terms and conditions</a> apply.</p>
              <p style="margin: 20px 0 10px 0; text-align: center; font-weight: bold;">Find out More about Us</p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="width: 33%;">
                    <a href="${EMAIL_CONFIG.instagramUrl}" style="text-decoration: none; color: ${colors.link};">
                      ${pictureHtml(
                        EMAIL_CONFIG.images.instagram.avif,
                        EMAIL_CONFIG.images.instagram.png,
                        "Instagram",
                        "width: 50px; height: auto; display: block; margin: 0 auto 8px auto;"
                      )}
                      <div style="font-weight: bold; font-size: 12px;">Instagram</div>
                    </a>
                  </td>
                  <td align="center" style="width: 33%;">
                    <a href="${EMAIL_CONFIG.hostelUrl}" style="text-decoration: none; color: ${colors.link};">
                      ${pictureHtml(
                        EMAIL_CONFIG.images.hostelIcon.avif,
                        EMAIL_CONFIG.images.hostelIcon.png,
                        "Hostel's Website",
                        "width: 50px; height: auto; display: block; margin: 0 auto 8px auto;"
                      )}
                      <div style="font-weight: bold; font-size: 12px;">Hostel's Website</div>
                    </a>
                  </td>
                  <td align="center" style="width: 33%;">
                    <a href="${EMAIL_CONFIG.tiktokUrl}" style="text-decoration: none; color: ${colors.link};">
                      ${pictureHtml(
                        EMAIL_CONFIG.images.tiktok.avif,
                        EMAIL_CONFIG.images.tiktok.png,
                        "TikTok",
                        "width: 50px; height: auto; display: block; margin: 0 auto 8px auto;"
                      )}
                      <div style="font-weight: bold; font-size: 12px;">TikTok</div>
                    </a>
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
  const paragraphs = text.split(/\n\n+/);

  return paragraphs
    .map((para) => {
      const withBreaks = para.trim().replace(/\n/g, "<br>");
      const withBold = withBreaks.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      const withLinks = withBold.replace(
        /(https?:\/\/[^\s<]+)/g,
        `<a href="$1" style="color: ${EMAIL_CONFIG.colors.link}; text-decoration: underline;">$1</a>`
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
  const nameMatch = from.match(/^([^<]+)</);
  if (nameMatch) {
    const fullName = nameMatch[1].trim().replace(/"/g, "");
    const firstName = fullName.split(/\s+/)[0];
    if (firstName && firstName.length > 1 && !firstName.includes("@")) {
      return firstName;
    }
  }
  return undefined;
}
