import { Section } from "@acme/design-system/atoms/Section";
import { LegalEntityCard } from "@acme/ui/components/organisms/LegalEntityCard";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";
import { PolicySection } from "@acme/ui/components/organisms/PolicySection";

import { XaInlineLink } from "../../../components/XaInlineLink";
import { siteConfig } from "../../../lib/siteConfig";

export default function TermsOfServicePage() {
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const packagingItems = siteConfig.catalog.packagingItems;
  const companyBlock = siteConfig.showLegalInfo ? (
    <LegalEntityCard title="Who we are">
      {siteConfig.legalEntityName ? <div>{siteConfig.legalEntityName}</div> : null}
      {siteConfig.legalAddress ? <div>{siteConfig.legalAddress}</div> : null}
      {siteConfig.domain ? <div>Domain: {siteConfig.domain}</div> : null}
      {siteConfig.jurisdiction ? <div>Governing law: {siteConfig.jurisdiction}</div> : null}
    </LegalEntityCard>
  ) : null;

  const contactBlock = siteConfig.showContactInfo && siteConfig.supportEmail ? (
    <p>
      Contact: <XaInlineLink className="underline" href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</XaInlineLink>
    </p>
  ) : (
    <p>For assistance, reach our customer care team via the contact channels listed in the footer.</p>
  );

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Terms of Service"
          description={`These Terms set out how you may access and use this site, purchase ${productDescriptor}, and interact with our services. Please read them carefully before ordering.`}
        />
      </Section>

      <Section padding="default">
        <PolicyContent>
          {companyBlock}

          <PolicySection title="1. Using the site">
            <p>
              You agree to use the site for personal, non-commercial purposes, to provide accurate information, and to
              refrain from any action that could damage or impair the site, interfere with other users, or bypass security
              or access controls.
            </p>
          </PolicySection>

          <PolicySection title="2. Products & descriptions">
            <p>
              We aim to display accurate product details, sizing, pricing, and availability. Minor variations in colour,
              finish, or packaging (including {packagingItems}) may occur. Availability is not guaranteed until an order is
              confirmed.
            </p>
          </PolicySection>

          <PolicySection title="3. Pricing & payment">
            <ul className="list-disc space-y-1 pl-5">
              <li>Prices are shown in your selected currency where supported and include/exclude taxes where indicated.</li>
              <li>Shipping, duties, and taxes may be added at checkout based on your destination.</li>
              <li>We may cancel or refuse an order if pricing, availability, or payment verification fails.</li>
              <li>Payment methods and currency options vary by region.</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Orders & contract">
            <p>
              Your order is an offer to purchase. We will confirm acceptance via an order confirmation. We may cancel for
              reasonable grounds (e.g., stock issues, failed verification, pricing errors). If we cancel, you will be
              refunded for any amounts charged.
            </p>
          </PolicySection>

          <PolicySection title="5. Delivery & risk">
            <ul className="list-disc space-y-1 pl-5">
              <li>Delivery windows are estimates. Delays may occur due to carrier or customs.</li>
              <li>Risk passes on delivery; title passes once payment clears.</li>
              <li>Inspect parcels on arrival and report visible damage promptly.</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Returns & cancellations">
            <p>
              Eligible items may be returned within the stated return window in our Returns Policy. Items must be unused,
              with tags and original packaging. Some items (e.g., customized, final sale, hygiene-sensitive) may be
              non-returnable. If you cancel before shipment, we will do our best to stop the order; otherwise standard
              returns apply.
            </p>
          </PolicySection>

          <PolicySection title="7. Accounts & security">
            <p>
              You are responsible for safeguarding your account credentials and for all activity under your account.
              Notify us immediately of suspected unauthorized use.
            </p>
          </PolicySection>

          <PolicySection title="8. Acceptable use">
            <ul className="list-disc space-y-1 pl-5">
              <li>No scraping, reverse engineering, or automated access beyond normal browsing.</li>
              <li>No uploading malicious code or interfering with site performance.</li>
              <li>No infringing, defamatory, or unlawful content or conduct.</li>
            </ul>
          </PolicySection>

          <PolicySection title="9. Intellectual property">
            <p>
              All content (including trademarks, designs, imagery, copy, code) is owned by or licensed to us. You may not
              reproduce, distribute, or create derivative works without permission.
            </p>
          </PolicySection>

          <PolicySection title="10. Third-party links">
            <p>
              We may link to third-party sites for convenience. We are not responsible for their content, terms, or
              privacy practices.
            </p>
          </PolicySection>

          <PolicySection title="11. Warranties & liability">
            <ul className="list-disc space-y-1 pl-5">
              <li>Services are provided on an “as is” and “as available” basis.</li>
              <li>
                To the maximum extent permitted by law, we exclude implied warranties and are not liable for indirect or
                consequential losses.
              </li>
              <li>
                Our total liability for any claim related to an order is limited to the amount you paid for that order,
                except where prohibited by law.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="12. Force majeure">
            <p>
              We are not responsible for delays or failures caused by events beyond our reasonable control (e.g., strikes,
              transport issues, natural events, regulatory actions).
            </p>
          </PolicySection>

          <PolicySection title="13. Privacy">
            <p>
              See our Privacy Policy for how we collect and use personal data. By using the site, you consent to that
              processing.
            </p>
          </PolicySection>

          <PolicySection title="14. Changes to these Terms">
            <p>
              We may update these Terms from time to time. Material changes will be posted on this page with an updated
              effective date. Continued use after changes constitutes acceptance.
            </p>
          </PolicySection>

          <PolicySection title="15. Contact">
            {contactBlock}
          </PolicySection>
        </PolicyContent>
      </Section>
    </main>
  );
}
