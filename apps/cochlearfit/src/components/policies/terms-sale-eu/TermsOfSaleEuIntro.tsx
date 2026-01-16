import Link from "next/link";
import type { Locale } from "@/types/locale";
import { withLocale } from "@/lib/routes";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";

type TermsOfSaleEuIntroProps = {
  locale: Locale;
  linkClassName: string;
  sectionClassName: string;
};

export default function TermsOfSaleEuIntro({
  locale,
  linkClassName,
  sectionClassName,
}: TermsOfSaleEuIntroProps) {
  return (
    <>
      <p>Last updated: 27 December 2025</p>

      <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Contents
        </div>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm">
          <li>
            <a href="#seller-information" className={linkClassName}>
              Seller information
            </a>
          </li>
          <li>
            <a href="#scope-and-definitions" className={linkClassName}>
              Scope and definitions
            </a>
          </li>
          <li>
            <a href="#products" className={linkClassName}>
              Products and product information
            </a>
          </li>
          <li>
            <a href="#ordering" className={linkClassName}>
              Ordering and contract formation
            </a>
          </li>
          <li>
            <a href="#prices-vat-promotions" className={linkClassName}>
              Prices, VAT, and promotions
            </a>
          </li>
          <li>
            <a href="#payment" className={linkClassName}>
              Payment
            </a>
          </li>
          <li>
            <a href="#delivery" className={linkClassName}>
              Delivery, shipping options, and restrictions
            </a>
          </li>
          <li>
            <a href="#withdrawal" className={linkClassName}>
              Statutory right of withdrawal
            </a>
          </li>
          <li>
            <a href="#returns-condition" className={linkClassName}>
              Condition of returns and diminished value
            </a>
          </li>
          <li>
            <a href="#defective" className={linkClassName}>
              Damaged on arrival, incorrect items, and defective goods
            </a>
          </li>
          <li>
            <a href="#returns-address" className={linkClassName}>
              Returns address and instructions
            </a>
          </li>
          <li>
            <a href="#customer-service" className={linkClassName}>
              Customer service and complaints
            </a>
          </li>
          <li>
            <a href="#liability" className={linkClassName}>
              Limitation of liability
            </a>
          </li>
          <li>
            <a href="#force-majeure" className={linkClassName}>
              Force majeure
            </a>
          </li>
          <li>
            <a href="#governing-law" className={linkClassName}>
              Governing law and jurisdiction
            </a>
          </li>
          <li>
            <a href="#changes" className={linkClassName}>
              Changes to these Terms
            </a>
          </li>
          <li>
            <a href="#annex-a" className={linkClassName}>
              Annex A (withdrawal form)
            </a>
          </li>
        </ol>
      </div>

      <section id="seller-information" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          1) Seller information
        </h2>
        <p>
          These Terms and Conditions of Sale (“Terms”) apply to purchases made through
          the Ear Solutions online store (the “Store”) for delivery within the European
          Union (EU) destinations offered at checkout.
        </p>
        <p>If you do not agree to these Terms, please do not place an order.</p>

        <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
          <div className="space-y-1">
            <div className="font-semibold text-foreground">Skylar SRL</div>
            <div>Via Guglielmo Marconi 358, Positano, 84017, Italy</div>
            <div>VAT number: 05476940654</div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Customer support (placeholders — replace before launch)
            </div>
            <div>
              Email:{" "}
              <a className={linkClassName} href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div>Phone: {SUPPORT_PHONE}</div>
            <div>
              WhatsApp:{" "}
              <a
                className={linkClassName}
                href="https://wa.me/XXXXXXXXXXX"
                rel="noreferrer"
                target="_blank"
              >
                https://wa.me/XXXXXXXXXXX
              </a>
            </div>
            <div>
              Contact page:{" "}
              <Link className={linkClassName} href={withLocale("/contact", locale)}>
                {withLocale("/contact", locale)}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

