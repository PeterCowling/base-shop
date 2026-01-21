/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy terms copy pending design/i18n overhaul */
import { Section } from "@acme/ui/atoms/Section";
import { siteConfig } from "../../../lib/siteConfig";

export default function TermsOfServicePage() {
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const packagingItems = siteConfig.catalog.packagingItems;
  const companyBlock = siteConfig.showLegalInfo ? (
    <div className="rounded-lg border border-border-2 bg-surface-2/50 p-4 text-sm">
      <div className="text-base font-semibold text-foreground">Who we are</div>
      {siteConfig.legalEntityName ? <div>{siteConfig.legalEntityName}</div> : null}
      {siteConfig.legalAddress ? <div>{siteConfig.legalAddress}</div> : null}
      {siteConfig.domain ? <div>Domain: {siteConfig.domain}</div> : null}
      {siteConfig.jurisdiction ? <div>Governing law: {siteConfig.jurisdiction}</div> : null}
    </div>
  ) : null;

  const contactBlock = siteConfig.showContactInfo && siteConfig.supportEmail ? (
    <p>
      Contact: <a className="underline" href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
    </p>
  ) : (
    <p>For assistance, reach our customer care team via the contact channels listed in the footer.</p>
  );

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Terms of Service</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          These Terms set out how you may access and use this site, purchase {productDescriptor}, and interact with our
          services. Please read them carefully before ordering.
        </p>
      </Section>

      <Section padding="default">
        <div className="space-y-8 text-sm text-muted-foreground">
          {companyBlock}

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Using the site</h2>
            <p>
              You agree to use the site for personal, non-commercial purposes, to provide accurate information, and to
              refrain from any action that could damage or impair the site, interfere with other users, or bypass security
              or access controls.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Products & descriptions</h2>
            <p>
              We aim to display accurate product details, sizing, pricing, and availability. Minor variations in colour,
              finish, or packaging (including {packagingItems}) may occur. Availability is not guaranteed until an order is
              confirmed.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Pricing & payment</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Prices are shown in your selected currency where supported and include/exclude taxes where indicated.</li>
              <li>Shipping, duties, and taxes may be added at checkout based on your destination.</li>
              <li>We may cancel or refuse an order if pricing, availability, or payment verification fails.</li>
              <li>Payment methods and currency options vary by region.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Orders & contract</h2>
            <p>
              Your order is an offer to purchase. We will confirm acceptance via an order confirmation. We may cancel for
              reasonable grounds (e.g., stock issues, failed verification, pricing errors). If we cancel, you will be
              refunded for any amounts charged.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Delivery & risk</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Delivery windows are estimates. Delays may occur due to carrier or customs.</li>
              <li>Risk passes on delivery; title passes once payment clears.</li>
              <li>Inspect parcels on arrival and report visible damage promptly.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Returns & cancellations</h2>
            <p>
              Eligible items may be returned within the stated return window in our Returns Policy. Items must be unused,
              with tags and original packaging. Some items (e.g., customized, final sale, hygiene-sensitive) may be
              non-returnable. If you cancel before shipment, we will do our best to stop the order; otherwise standard
              returns apply.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Accounts & security</h2>
            <p>
              You are responsible for safeguarding your account credentials and for all activity under your account.
              Notify us immediately of suspected unauthorized use.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Acceptable use</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>No scraping, reverse engineering, or automated access beyond normal browsing.</li>
              <li>No uploading malicious code or interfering with site performance.</li>
              <li>No infringing, defamatory, or unlawful content or conduct.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">9. Intellectual property</h2>
            <p>
              All content (including trademarks, designs, imagery, copy, code) is owned by or licensed to us. You may not
              reproduce, distribute, or create derivative works without permission.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">10. Third-party links</h2>
            <p>
              We may link to third-party sites for convenience. We are not responsible for their content, terms, or
              privacy practices.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">11. Warranties & liability</h2>
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
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">12. Force majeure</h2>
            <p>
              We are not responsible for delays or failures caused by events beyond our reasonable control (e.g., strikes,
              transport issues, natural events, regulatory actions).
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">13. Privacy</h2>
            <p>
              See our Privacy Policy for how we collect and use personal data. By using the site, you consent to that
              processing.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">14. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be posted on this page with an updated
              effective date. Continued use after changes constitutes acceptance.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">15. Contact</h2>
            {contactBlock}
          </div>
        </div>
      </Section>
    </main>
  );
}
