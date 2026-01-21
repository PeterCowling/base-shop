import Link from "next/link";

import { withLocale } from "@/lib/routes";
import type { Locale } from "@/types/locale";

type TermsOfSaleEuPartBProps = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  bulletClassName: string;
  linkClassName: string;
  sectionClassName: string;
};

export default function TermsOfSaleEuPartB({
  locale,
  t,
  bulletClassName,
  linkClassName,
  sectionClassName,
}: TermsOfSaleEuPartBProps) {
  return (
    <>
      <section id="delivery" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          7) Delivery, shipping options, and shipping restrictions
        </h2>
        <p>
          See also:{" "}
          <Link className={linkClassName} href={withLocale("/policies/shipping", locale)}>
            {t("policy.shipping")}
          </Link>
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7.1 Delivery territories
        </h3>
        <p>
          The Store is EU‑only. We currently offer delivery only to the EU destinations
          presented at checkout.
        </p>
        <p>
          Mainland-only shipping (launch policy): We ship to mainland Italy, Germany,
          France, and Spain only, with specific excluded regions (see 7.2).
        </p>
        <p>
          If your address is excluded, available shipping options will not be shown and
          you will not be able to complete checkout.
        </p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7.2 Excluded regions (launch policy)
        </h3>
        <p>We do not ship to:</p>
        <ul className={bulletClassName}>
          <li>France: Corsica</li>
          <li>Germany: Heligoland and Büsingen</li>
          <li>Italy: Sardegna (Sardinia)</li>
        </ul>
        <p>
          We currently ship to Sicilia, and we also accept orders to Livigno and
          Campione d’Italia when supported by our checkout configuration.
        </p>
        <p>We may update this list over time.</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7.3 Carriers
        </h3>
        <ul className={bulletClassName}>
          <li>Italy: SDA</li>
          <li>
            Germany/France/Spain: DHL (service depends on your selected shipping option)
          </li>
        </ul>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7.4 Shipping options and live rates
        </h3>
        <p>
          Shipping prices and available services are calculated at checkout using live
          carrier rates. Customers may choose from the services available for their
          destination.
        </p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7.5 Dispatch schedule and “same‑day dispatch”
        </h3>
        <p>We dispatch Orders Monday to Friday only.</p>
        <p>“Same‑day dispatch” is possible only if:</p>
        <ul className={bulletClassName}>
          <li>payment is captured,</li>
          <li>the Order is fully processed and confirmed by email, and</li>
          <li>this happens before 11:00 Italy time on a working day.</li>
        </ul>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7.6 Delivery times
        </h3>
        <p>
          Any delivery times shown are estimates and can be affected by factors beyond
          our control (e.g., carrier delays, weather, customs or special territory
          processes, strikes, and peak periods).
        </p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7.7 Risk and title
        </h3>
        <p>
          Risk of loss passes to you when you (or a person you nominate) take physical
          possession of the Goods.
        </p>
        <p>Title to the Goods passes to you once we have received full payment.</p>
      </section>

      <section id="withdrawal" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          8) Your statutory right of withdrawal (EU consumers)
        </h2>
        <p>
          See also:{" "}
          <Link className={linkClassName} href={withLocale("/policies/returns", locale)}>
            {t("policy.returns")}
          </Link>
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          8.1 14‑day withdrawal right
        </h3>
        <p>
          If you are a consumer, you generally have the right to withdraw from a distance
          contract within 14 days of receiving the Goods, without giving any reason.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          8.2 How to exercise withdrawal
        </h3>
        <p>
          To withdraw, you must inform us of your decision within the 14‑day period by an
          unequivocal statement (e.g., email). You may use a withdrawal form template{" "}
          (<a className={linkClassName} href="#annex-a">
            see Annex A
          </a>
          ), but it is not mandatory.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          8.3 Return deadline after notifying withdrawal
        </h3>
        <p>After notifying us, you must send back the Goods within 14 days.</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          8.4 Return shipping costs
        </h3>
        <p>
          Unless we agree otherwise, you bear the direct cost of returning the Goods when
          you withdraw.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          8.5 Refund timing
        </h3>
        <p>
          We will reimburse you without undue delay and no later than 14 days from the day
          we are informed of your decision to withdraw. We may withhold reimbursement until
          we have received the Goods back or you have provided evidence of having sent them back.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          8.6 What we refund (including shipping)
        </h3>
        <p>If you withdraw, we refund:</p>
        <ul className={bulletClassName}>
          <li>the product price you paid, and</li>
          <li>
            the cost of standard delivery (the least expensive delivery option we offered
            at checkout for your Order).
          </li>
        </ul>
        <p>
          If you chose a more expensive delivery option (e.g., express), we do not refund the extra cost above standard delivery.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          8.7 No exchanges
        </h3>
        <p>
          We do not offer exchanges. If you want a different size or pattern, you may place a new Order and (if eligible) withdraw from the original purchase under these Terms.
        </p>
      </section>

      <section id="returns-condition" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          9) Condition of returns and diminished value
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          9.1 Reasonable handling (“try on”)
        </h3>
        <p>
          You may inspect and try on the Goods as you would in a shop, but you are responsible for any diminished value caused by handling beyond what is necessary to establish the nature, characteristics, and functioning of the Goods.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          9.2 Hygiene-sensitive handling
        </h3>
        <p>
          Because headbands are worn close to hair and skin, we ask you to handle them hygienically if you think you may return them:
        </p>
        <ul className={bulletClassName}>
          <li>try on briefly over clean, dry hair</li>
          <li>do not use in water if you may return</li>
          <li>do not wash before deciding to keep</li>
          <li>return all included parts</li>
        </ul>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          9.3 Refund reductions for diminished value
        </h3>
        <p>
          If returned Goods show handling beyond what is necessary for inspection (for example, obvious signs of prolonged wear, odours, stains, hair, stretching beyond normal try‑on, or water exposure), we may reduce your refund to reflect the diminished value, in line with applicable law.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          9.4 Bundles and partial returns
        </h3>
        <p>If you purchased a bundle or received a discount:</p>
        <ul className={bulletClassName}>
          <li>We allocate the bundle or discounted price across the items pro‑rata based on standalone prices.</li>
          <li>Refunds for returned items are calculated using their allocated discounted value.</li>
          <li>If only part of an Order is returned, we may refund outbound standard delivery costs pro‑rata (for example, in proportion to the number of items returned), consistent with the approach disclosed in these Terms.</li>
        </ul>
      </section>

      <section id="defective" className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          10) Damaged on arrival, incorrect items, and defective goods
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          10.1 Damage in transit / wrong item
        </h3>
        <p>
          If the Goods arrive damaged or we sent the wrong item, contact us promptly with your order number and photos of the item and packaging. We will offer an appropriate remedy (replacement or refund) depending on circumstances.
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          10.2 Legal guarantee (lack of conformity)
        </h3>
        <p>
          EU consumer law provides a legal guarantee for goods that are not in conformity with the contract. Generally, the seller is liable for lack of conformity that exists at delivery and becomes apparent within at least two years, with specific rules varying by Member State.
        </p>
        <p>
          Where applicable, you may be entitled to repair, replacement, price reduction, or termination/refund depending on the issue and legal framework.
        </p>
      </section>
    </>
  );
}

