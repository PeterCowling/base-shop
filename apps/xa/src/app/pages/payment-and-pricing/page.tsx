/* eslint-disable ds/no-hardcoded-copy, ds/container-widths-only-at, ds/min-tap-size -- XA-123 [ttl=2026-12-31] XA marketing copy pending localization */
import { Section } from "@acme/design-system/atoms/Section";

import { siteConfig } from "../../../lib/siteConfig";

export default function PaymentAndPricingPage() {
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const contactEmailLink =
    siteConfig.showContactInfo && siteConfig.supportEmail ? (
      <a className="underline" href={`mailto:${siteConfig.supportEmail}`}>
        {siteConfig.supportEmail}
      </a>
    ) : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Payments and pricing</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Here’s how pricing works, what you’ll pay at checkout, and which payment options may be
          available for your {productDescriptor} order.
        </p>
      </Section>

      <Section padding="default">
        <div className="space-y-8 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Pricing</h2>
            <p>
              Prices can vary by item, availability, and delivery destination. The total shown at
              checkout is the price you pay for that order. Adding an item to your bag or wishlist
              does not reserve stock or lock in a price.
            </p>
            <p>
              If a price changes between browsing and checkout, the checkout total will reflect the
              most up-to-date price for your destination.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Currency</h2>
            <p>
              Currency options depend on your delivery destination. If your local currency is not
              available, your card issuer or payment provider may apply an exchange rate and fees.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Taxes and duties</h2>
            <p>
              Taxes, import duties, and customs fees depend on where your order is shipped from and
              delivered to. Where applicable, we’ll show whether these costs are included in your
              checkout total or payable on delivery.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                If duties and taxes are included, you shouldn’t be asked to pay additional import
                charges on delivery.
              </li>
              <li>
                If duties and taxes are not included, your courier may contact you to collect them
                before delivery.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Accepted payment methods</h2>
            <p>
              Available payment methods vary by country and may change over time. The options shown
              at checkout are the payment methods available for your order.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Major credit and debit cards</li>
              <li>Digital wallets (where supported)</li>
              <li>Alternative methods such as PayPal or local payment options (where supported)</li>
              <li>Buy now, pay later options (where supported)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. When you’ll be charged</h2>
            <p>
              We typically charge your selected payment method when you place an order. Some payment
              methods may authorize the amount first and capture it later (for example, when your
              order ships).
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Payment security</h2>
            <p>
              We use security checks to help protect customers and prevent fraud. In some cases, we
              may request additional verification or cancel an order if we cannot confirm payment
              details.
            </p>
          </div>

          <div className="space-y-2">
            <h2 id="promotions" className="text-lg font-semibold text-foreground">
              7. Promotions
            </h2>
            <p>
              Promotional discounts may apply to selected items and may be subject to eligibility
              rules (such as minimum spend, exclusions, and time limits). If a promo code is
              available, you can apply it at checkout.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Need help?</h2>
            {contactEmailLink ? (
              <p>For payment or pricing questions, contact us at {contactEmailLink}.</p>
            ) : (
              <p>For payment or pricing questions, use the contact channels listed in the footer.</p>
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}
