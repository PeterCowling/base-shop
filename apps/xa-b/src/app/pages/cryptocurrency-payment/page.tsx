/* eslint-disable ds/no-hardcoded-copy, ds/no-physical-direction-classes-in-rtl, ds/container-widths-only-at, ds/min-tap-size -- XA-123 [ttl=2026-12-31] XA marketing copy pending localization */
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { siteConfig } from "../../../lib/siteConfig";

const LAST_UPDATED = "29 December 2025";

export default function CryptocurrencyPaymentPage() {
  const brandName = siteConfig.brandName;
  const contactEmail = siteConfig.showContactInfo && siteConfig.supportEmail ? siteConfig.supportEmail : "";
  const contactEmailLink = contactEmail ? <a className="underline" href={`mailto:${contactEmail}`}>{contactEmail}</a> : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Cryptocurrency payments</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Where available, you can pay for orders on {brandName} using cryptocurrency. Crypto payments are processed through a third-party payment provider. We do not store your wallet keys or have access to your funds.</p>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </Section>

      <Section padding="default">
        <div className="space-y-10 text-sm text-muted-foreground">
          <Accordion type="multiple" className="divide-y">
            <AccordionItem value="availability">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                Availability
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <p>
                  Cryptocurrency payments are available only in certain locations, currencies, and
                  order scenarios, and can change over time. If crypto payments are available for your
                  order, you’ll see them as an option at checkout.
                </p>
                <p>
                  If you don’t see cryptocurrency at checkout, you can still pay using the other
                  payment methods shown there.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="supported">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                Which cryptocurrencies are supported?
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <p>
                  The supported cryptocurrencies are shown in checkout and may vary by country and by
                  the payment provider. If a particular coin isn’t available, it won’t appear as an
                  option for that order.
                </p>
                <p>
                  Prices on our site are displayed in your selected/available currency. The provider
                  will show you the equivalent crypto amount when you choose cryptocurrency at
                  checkout.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-it-works">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                How it works at checkout
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Select cryptocurrency as your payment method at checkout (if available).</li>
                  <li>
                    Review the quote, including the crypto amount, exchange rate used, and any fees
                    shown by the provider.
                  </li>
                  <li>
                    Complete payment by following the provider instructions (for example, scanning a
                    QR code or sending funds to a wallet address).
                  </li>
                  <li>
                    Once the provider confirms payment, we’ll process your order and send you an order
                    confirmation.
                  </li>
                </ol>
                <p>
                  Crypto transactions are typically irreversible. Please double-check the payment
                  details before confirming.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="exchange-rate">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                Exchange rates, timing, and fees
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <p>
                  When you choose cryptocurrency at checkout, the provider generates a quote based on
                  current exchange rates. Quotes usually expire after a short time. If a quote expires
                  before you complete payment, you may need to restart the crypto checkout flow to
                  receive a new quote.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <span className="text-foreground">Network fees:</span> blockchain/network fees are
                    charged by the network and are outside our control.
                  </li>
                  <li>
                    <span className="text-foreground">Provider fees:</span> the provider may include
                    fees in the quote or show them during checkout.
                  </li>
                  <li>
                    <span className="text-foreground">Under/over payments:</span> if the amount sent
                    doesn’t match the quote, processing may be delayed or the payment may fail.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="confirmation">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                Order confirmation and failed payments
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <p>
                  Your order is not confirmed until the crypto payment is successfully completed and
                  confirmed by the provider. If the payment is not completed (for example, it expires
                  or fails), the order will not be processed.
                </p>
                <p>
                  If you believe you were charged but didn’t receive an order confirmation, please
                  reach out to us with as much detail as possible (email, order attempt time, and any
                  provider reference).
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refunds">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                Returns and refunds for crypto orders
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <p>
                  Returns are handled under our{" "}
                  <Link className="underline text-foreground" href="/pages/return-policy">
                    Return Policy
                  </Link>
                  . If your return is approved, refunds for cryptocurrency orders are processed via
                  the original payment provider.
                </p>
                <p>
                  Depending on the provider, the refund may be issued in the original cryptocurrency
                  or as a value-equivalent amount. Because crypto exchange rates can move, the amount
                  you receive can differ from the crypto amount originally paid, and network fees may
                  not be refundable.
                </p>
                <p>
                  For some refunds, the provider may request additional details (for example, a wallet
                  address) to complete the refund.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                Security and verification
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <p>
                  We and our partners may use automated and manual checks to help prevent fraud and
                  keep the platform secure. In some cases we may request additional information or
                  cancel an order if we cannot complete verification.
                </p>
                <p>
                  Cryptocurrency payments may be unavailable for certain orders or customers based on
                  risk, regulatory requirements, or provider limitations.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="more">
              <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold text-foreground">
                More information
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6">
                <p>
                  Your use of the site is governed by our{" "}
                  <Link className="underline text-foreground" href="/pages/terms-of-service">
                    Terms of Service
                  </Link>{" "}
                  and our{" "}
                  <Link className="underline text-foreground" href="/pages/privacy-policy">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <p>
                  If you need help, you can reach our customer care team via the{" "}
                  <Link className="underline text-foreground" href="/pages/contact-us">
                    contact page
                  </Link>
                  {contactEmailLink ? <> or email {contactEmailLink}</> : null}.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="rounded-lg border border-border-2 bg-surface-2/50 p-4">
            <div className="text-base font-semibold text-foreground">Need help?</div>
            <p className="mt-2">
              If you have questions about paying with cryptocurrency (availability, failed payments,
              or refunds), contact us via the{" "}
              <Link className="underline text-foreground" href="/pages/contact-us">
                contact page
              </Link>
              {contactEmailLink ? <> or email {contactEmailLink}</> : null}.
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}
