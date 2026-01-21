/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy policy copy pending design/i18n overhaul */
import Link from "next/link";
import { Section } from "@acme/ui/atoms/Section";
import { siteConfig } from "../../../lib/siteConfig";

const LAST_UPDATED = "29 December 2025";

export default function PrivacyPolicyPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const contactEmail =
    siteConfig.showContactInfo && siteConfig.supportEmail ? siteConfig.supportEmail : "";

  const contactEmailLink = contactEmail ? (
    <a className="underline" href={`mailto:${contactEmail}`}>
      {contactEmail}
    </a>
  ) : null;

  const companyBlock = siteConfig.showLegalInfo ? (
    <div className="rounded-lg border border-border-2 bg-surface-2/50 p-4 text-sm">
      <div className="text-base font-semibold text-foreground">Data controller</div>
      {siteConfig.legalEntityName ? <div>{siteConfig.legalEntityName}</div> : null}
      {siteConfig.legalAddress ? <div>{siteConfig.legalAddress}</div> : null}
      {siteConfig.domain ? <div>Domain: {siteConfig.domain}</div> : null}
      {siteConfig.jurisdiction ? <div>Jurisdiction: {siteConfig.jurisdiction}</div> : null}
      {contactEmailLink ? <div>Privacy contact: {contactEmailLink}</div> : null}
    </div>
  ) : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          This Privacy Policy explains how {brandName} (“we”, “us”, “our”) collects, uses, shares, and
          protects personal data when you visit our website, create an account, place an order for{" "}
          {productDescriptor}, contact customer care, or otherwise interact with our services.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </Section>

      <Section padding="default">
        <div className="space-y-8 text-sm text-muted-foreground">
          {companyBlock}

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. What this policy covers</h2>
            <p>
              This policy applies to personal data we process when you browse our site, shop with us,
              contact customer care, participate in promotions, or otherwise use our services. Our
              services may include products supplied by third-party partners; those partners may process
              your personal data under their own privacy policies. This policy also does not cover
              third-party sites or services that we link to.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Personal data we collect</h2>
            <p>We collect personal data in the following categories:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">Identifiers and contact details:</span>{" "}
                name, email address, phone number, and shipping/billing address.
              </li>
              <li>
                <span className="font-semibold text-foreground">Account information:</span>{" "}
                login details and security information, saved addresses, wishlist items, and the
                preferences you choose to set (such as language/currency where available).
              </li>
              <li>
                <span className="font-semibold text-foreground">Order and service information:</span>{" "}
                items purchased, order history, delivery instructions, returns/refunds, and customer
                care interactions.
              </li>
              <li>
                <span className="font-semibold text-foreground">Payment information:</span>{" "}
                card details are handled by our payment providers; we typically receive limited
                information (for example, payment status and a token or partial card details) so we can
                process your order and handle refunds.
              </li>
              <li>
                <span className="font-semibold text-foreground">Communications:</span>{" "}
                messages you send to us (for example, by email or via customer care) and our responses.
              </li>
              <li>
                <span className="font-semibold text-foreground">Device and usage information:</span>{" "}
                IP address, device identifiers, browser type, pages viewed, clicks, timestamps, and
                cookie data. Where enabled, we use this to understand site usage and improve the
                experience.
              </li>
              <li>
                <span className="font-semibold text-foreground">Preferences and insights:</span>{" "}
                such as sizing preferences you provide, marketing preferences, and inferences we draw
                from your activity (for example, the types of products you browse).
              </li>
            </ul>
            <p>
              We may also receive information from third parties, such as delivery carriers (tracking
              updates), payment providers (payment confirmation), fraud prevention partners, and
              analytics/advertising partners (where enabled).
            </p>
            <p>
              If you choose not to provide certain information, you may not be able to create an
              account, complete a purchase, or access some features.
            </p>
            <p>
              We do not intentionally collect sensitive or special category data (for example, health
              information). Please avoid sending sensitive information through customer support
              channels.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              3. How we use personal data (and legal bases)
            </h2>
            <p>We use personal data to operate, protect, and improve our services, including to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Create and manage accounts, authenticate users, and remember preferences.</li>
              <li>Process orders, take payments, deliver items, and manage returns and refunds.</li>
              <li>Provide customer care, respond to requests, and handle complaints.</li>
              <li>Detect, prevent, and investigate fraud, abuse, and security incidents.</li>
              <li>Send service communications (for example, order and delivery updates).</li>
              <li>
                Where permitted, send marketing communications and personalize content based on your
                preferences and interactions.
              </li>
              <li>Comply with legal obligations and enforce our Terms and other policies.</li>
            </ul>
            <p>
              Where laws such as the GDPR apply, we rely on the following legal bases for processing:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">Contract:</span> to create and manage
                your account, process orders, handle payments, deliver items, and manage returns and
                refunds.
              </li>
              <li>
                <span className="font-semibold text-foreground">Legitimate interests:</span> to keep
                our site secure, prevent fraud, improve performance, understand how customers use
                the site, and provide relevant customer care.
              </li>
              <li>
                <span className="font-semibold text-foreground">Legal obligations:</span> to comply
                with accounting, tax, consumer protection, and other regulatory requirements.
              </li>
              <li>
                <span className="font-semibold text-foreground">Consent:</span> where required for
                marketing communications and certain cookies/advertising technologies.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 id="cookies" className="text-lg font-semibold text-foreground">
              4. Cookies and similar tech
            </h2>
            <p>
              We use cookies and similar technologies to enable core site functionality, remember
              preferences, improve performance, and (where enabled) measure and personalize
              marketing. You can manage cookies through your browser settings and, where available,
              any cookie preference tools we provide. Where required by law, we will ask for consent
              before using non-essential cookies.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">Strictly necessary</span> cookies help
                with core functionality such as security and session management.
              </li>
              <li>
                <span className="font-semibold text-foreground">Preferences</span> cookies remember
                selections such as language and currency where available.
              </li>
              <li>
                <span className="font-semibold text-foreground">Analytics</span> cookies help us
                measure performance and improve the site.
              </li>
              <li>
                <span className="font-semibold text-foreground">Advertising</span> cookies (where
                enabled) help us measure campaigns and show more relevant marketing.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. How we share personal data</h2>
            <p>We may share personal data with:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">Service providers</span> that help us
                run the site and deliver services (hosting, payments, fraud prevention, customer
                support, logistics, analytics, and marketing partners).
              </li>
              <li>
                <span className="font-semibold text-foreground">Brand, boutique, and fulfilment partners</span>{" "}
                (where applicable) that prepare, ship, and support your order (including returns and
                customer care).
              </li>
              <li>
                <span className="font-semibold text-foreground">Delivery partners</span> to ship your
                orders and provide tracking updates.
              </li>
              <li>
                <span className="font-semibold text-foreground">Authorities</span> where required by
                law or to protect rights, safety, and security (including to prevent fraud).
              </li>
              <li>
                <span className="font-semibold text-foreground">Professional advisors</span> such as
                auditors, insurers, and legal counsel where necessary.
              </li>
              <li>
                <span className="font-semibold text-foreground">Corporate transactions</span> (such
                as a merger, acquisition, or asset sale), where personal data may be transferred
                subject to appropriate safeguards.
              </li>
            </ul>
            <p>
              Where service providers process personal data on our behalf, we require them to process
              it only on our instructions and to use appropriate safeguards designed to protect it.
            </p>
            <p>
              Depending on how your order is fulfilled, a third-party partner may process certain
              personal data as an independent controller (for example, to comply with its own legal
              obligations). In those cases, that partner’s privacy policy will apply to its
              processing.
            </p>
            <p>
              We do not share personal data with third parties for their own direct marketing
              purposes unless you ask us to or you have otherwise consented.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. International transfers</h2>
            <p>
              Our service providers and partners may process personal data outside the country where
              you live. When we transfer personal data internationally, we use safeguards required by
              applicable law (for example, standard contractual clauses) and take steps to protect
              your information.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Marketing preferences</h2>
            <p>
              You can opt out of marketing emails at any time by using the unsubscribe link in our
              messages. Where we offer other channels (such as SMS), you can opt out using the
              instructions provided at the time you sign up or in the message itself. If you opt out,
              we may still send you non-marketing communications related to your orders or account.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              8. Automated decision-making and fraud prevention
            </h2>
            <p>
              We use automated tools to help keep our platform secure and to detect and prevent
              fraud. This can include assessing signals related to account activity, payment attempts,
              device information, and order patterns. You can contact us if you believe a decision
              was made in error.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">9. Data retention</h2>
            <p>
              We keep personal data only as long as needed for the purposes described above. Retention
              periods depend on the type of data and why we need it, including to provide services,
              resolve disputes, enforce agreements, and comply with legal obligations (such as tax and
              accounting rules).
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">10. Security</h2>
            <p>
              We use technical and organizational measures designed to protect personal data. No
              method of transmission or storage is fully secure, so we cannot guarantee absolute
              security. Please keep your account credentials confidential and notify us of any
              suspected unauthorized access.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">11. Your rights</h2>
            <p>
              Depending on where you live, you may have rights in relation to your personal data,
              including to access, correct, delete, restrict or object to processing, and request
              portability. Where processing is based on consent, you can withdraw consent at any time.
            </p>
            <p>
              To make a request, please contact us via the{" "}
              <Link className="underline" href="/pages/contact-us">
                contact page
              </Link>
              {contactEmailLink ? <> or email {contactEmailLink}</> : null}. We may need to verify your
              identity before responding.
            </p>
            <p>
              If you are in the EEA/UK, you also have the right to lodge a complaint with your local
              data protection authority.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">12. Children</h2>
            <p>
              Our services are not intended for children. We do not knowingly collect personal data
              from children, and we will take steps to delete it if we become aware we have collected
              it.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">13. Third-party links</h2>
            <p>
              Our site may include links to third-party websites or services (for example, social
              networks). Their privacy practices are governed by their own policies, and we are not
              responsible for their content or practices.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">14. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version
              on this page and update the “Last updated” date above. If changes are material, we may
              provide additional notice as required by law.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">15. Contact us</h2>
            <p>
              For privacy questions or to exercise your rights, contact us via the{" "}
              <Link className="underline" href="/pages/contact-us">
                contact page
              </Link>
              {contactEmailLink ? <> or email {contactEmailLink}</> : null}.
            </p>
            {siteConfig.showLegalInfo && siteConfig.legalAddress ? (
              <p>
                You can also write to us at: <span className="text-foreground">{siteConfig.legalAddress}</span>
              </p>
            ) : null}
          </div>
        </div>
      </Section>
    </main>
  );
}
