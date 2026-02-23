import { Section } from "@acme/design-system/atoms/Section";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { XaInlineLink } from "../../../components/XaInlineLink";
import { siteConfig } from "../../../lib/siteConfig";

export default function PaymentAndPricingPage() {
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const contactEmailLink =
    siteConfig.showContactInfo && siteConfig.supportEmail ? (
      <XaInlineLink href={`mailto:${siteConfig.supportEmail}`} className="underline">
        {siteConfig.supportEmail}
      </XaInlineLink>
    ) : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Payments and pricing"
          description={`Here’s how pricing works, what you’ll pay at checkout, and which payment options may be available for your ${productDescriptor} order.`}
        />
      </Section>

      <Section padding="default">
        <PolicyContent>
          <PolicySection title="1. Pricing">
            <p>
              Prices can vary by item, availability, and delivery destination. The total shown at
              checkout is the price you pay for that order. Adding an item to your bag or wishlist
              does not reserve stock or lock in a price.
            </p>
            <p>
              If a price changes between browsing and checkout, the checkout total will reflect the
              most up-to-date price for your destination.
            </p>
          </PolicySection>

          <PolicySection title="2. Currency">
            <p>
              Currency options depend on your delivery destination. If your local currency is not
              available, your card issuer or payment provider may apply an exchange rate and fees.
            </p>
          </PolicySection>

          <PolicySection title="3. Taxes and duties">
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
          </PolicySection>

          <PolicySection title="4. Accepted payment methods">
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
          </PolicySection>

          <PolicySection title="5. When you’ll be charged">
            <p>
              We typically charge your selected payment method when you place an order. Some payment
              methods may authorize the amount first and capture it later (for example, when your
              order ships).
            </p>
          </PolicySection>

          <PolicySection title="6. Payment security">
            <p>
              We use security checks to help protect customers and prevent fraud. In some cases, we
              may request additional verification or cancel an order if we cannot confirm payment
              details.
            </p>
          </PolicySection>

          <PolicySection title="7. Promotions" titleId="promotions">
            <p>
              Promotional discounts may apply to selected items and may be subject to eligibility
              rules (such as minimum spend, exclusions, and time limits). If a promo code is
              available, you can apply it at checkout.
            </p>
          </PolicySection>

          <PolicySection title="8. Need help?">
            {contactEmailLink ? (
              <p>For payment or pricing questions, contact us at {contactEmailLink}.</p>
            ) : (
              <p>For payment or pricing questions, use the contact channels listed in the footer.</p>
            )}
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
