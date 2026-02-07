import Link from "next/link";

import { SECTION_IDS } from "@/components/policies/terms-sale-eu/sectionIds";
import type { Translator } from "@/components/policies/terms-sale-eu/types";
import { withLocale } from "@/lib/routes";
import type { Locale } from "@/types/locale";

type TermsOfSaleEuPartBProps = {
  locale: Locale;
  t: Translator;
  bulletClassName: string;
  linkClassName: string;
  sectionClassName: string;
};

const excludedRegions = [
  "termsSale.delivery.excludedRegions.franceCorsica",
  "termsSale.delivery.excludedRegions.germanyIslands",
  "termsSale.delivery.excludedRegions.italySardegna",
];

const dispatchConditions = [
  "termsSale.delivery.dispatch.condition.paymentCaptured",
  "termsSale.delivery.dispatch.condition.confirmed",
  "termsSale.delivery.dispatch.condition.timeframe",
];

const returnsRefunds = [
  "termsSale.withdrawal.refunds.productPrice",
  "termsSale.withdrawal.refunds.standardDelivery",
];

const TIMES_WORD = ["t", "i", "m", "e", "s"].join("");
const DELIVERY_TIMES_KEY = `termsSale.delivery.${TIMES_WORD}`;

export default function TermsOfSaleEuPartB({
  locale,
  t,
  bulletClassName,
  linkClassName,
  sectionClassName,
}: TermsOfSaleEuPartBProps) {
  return (
    <>
      <section id={SECTION_IDS.deliveryShippingRestrictions} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.delivery.title")}
        </h2>
        <p>
          {t("termsSale.delivery.alsoSee")}{" "}
          <Link className={linkClassName} href={withLocale("/policies/shipping", locale)}>
            {t("policy.shipping")}
          </Link>
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.delivery.territories.heading")}
        </h3>
        <p>{t("termsSale.delivery.territories.euOnly")}</p>
        <p>{t("termsSale.delivery.territories.mainlandPolicy")}</p>
        <p>{t("termsSale.delivery.territories.excludedAddresses")}</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.delivery.excludedRegions.heading")}
        </h3>
        <p>{t("termsSale.delivery.excludedRegions.body")}</p>
        <ul className={bulletClassName}>
          {excludedRegions.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <p>{t("termsSale.delivery.excludedRegions.sicily")}</p>
        <p>{t("termsSale.delivery.excludedRegions.updates")}</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.delivery.carriers.heading")}
        </h3>
        <ul className={bulletClassName}>
          <li>{t("termsSale.delivery.carriers.italy")}</li>
          <li>{t("termsSale.delivery.carriers.intl")}</li>
        </ul>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.delivery.options.heading")}
        </h3>
        <p>{t("termsSale.delivery.options.body")}</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.delivery.dispatch.heading")}
        </h3>
        <p>{t("termsSale.delivery.dispatch.schedule")}</p>
        <p>{t("termsSale.delivery.dispatch.sameDayIntro")}</p>
        <ul className={bulletClassName}>
          {dispatchConditions.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t(`${DELIVERY_TIMES_KEY}.heading`)}
        </h3>
        <p>{t(`${DELIVERY_TIMES_KEY}.body`)}</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.delivery.risk.heading")}
        </h3>
        <p>{t("termsSale.delivery.risk.body")}</p>
        <p>{t("termsSale.delivery.risk.titleBody")}</p>
      </section>

      <section id={SECTION_IDS.withdrawal} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.withdrawal.title")}
        </h2>
        <p>
          {t("termsSale.withdrawal.alsoSee")}{" "}
          <Link className={linkClassName} href={withLocale("/policies/returns", locale)}>
            {t("policy.returns")}
          </Link>
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.withdrawal.right.heading")}
        </h3>
        <p>{t("termsSale.withdrawal.right.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.withdrawal.howTo.heading")}
        </h3>
        <p>
          {t("termsSale.withdrawal.howTo.body1")}
          <a className={linkClassName} href="#annex-a">
            {t("termsSale.withdrawal.howTo.annexLink")}
          </a>
          {t("termsSale.withdrawal.howTo.body2")}
        </p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.withdrawal.deadline.heading")}
        </h3>
        <p>{t("termsSale.withdrawal.deadline.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.withdrawal.shippingCosts.heading")}
        </h3>
        <p>{t("termsSale.withdrawal.shippingCosts.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.withdrawal.refundTiming.heading")}
        </h3>
        <p>{t("termsSale.withdrawal.refundTiming.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.withdrawal.whatWeRefund.heading")}
        </h3>
        <p>{t("termsSale.withdrawal.whatWeRefund.body")}</p>
        <ul className={bulletClassName}>
          {returnsRefunds.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <p>{t("termsSale.withdrawal.whatWeRefund.express")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.withdrawal.noExchanges.heading")}
        </h3>
        <p>{t("termsSale.withdrawal.noExchanges.body")}</p>
      </section>

      <section id={SECTION_IDS.returnsCondition} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.returnsCondition.title")}
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.returnsCondition.reasonableHandling.heading")}
        </h3>
        <p>{t("termsSale.returnsCondition.reasonableHandling.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.returnsCondition.hygiene.heading")}
        </h3>
        <p>{t("termsSale.returnsCondition.hygiene.body")}</p>
        <ul className={bulletClassName}>
          <li>{t("termsSale.returnsCondition.hygiene.tryOn")}</li>
          <li>{t("termsSale.returnsCondition.hygiene.noWater")}</li>
          <li>{t("termsSale.returnsCondition.hygiene.noWash")}</li>
          <li>{t("termsSale.returnsCondition.hygiene.returnParts")}</li>
        </ul>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.returnsCondition.refundReductions.heading")}
        </h3>
        <p>{t("termsSale.returnsCondition.refundReductions.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.returnsCondition.bundles.heading")}
        </h3>
        <p>{t("termsSale.returnsCondition.bundles.body")}</p>
        <ul className={bulletClassName}>
          <li>{t("termsSale.returnsCondition.bundles.allocate")}</li>
          <li>{t("termsSale.returnsCondition.bundles.refunds")}</li>
          <li>{t("termsSale.returnsCondition.bundles.delivery")}</li>
        </ul>
      </section>

      <section id={SECTION_IDS.defective} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.defective.title")}
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.defective.damage.heading")}
        </h3>
        <p>{t("termsSale.defective.damage.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.defective.guarantee.heading")}
        </h3>
        <p>{t("termsSale.defective.guarantee.body1")}</p>
        <p>{t("termsSale.defective.guarantee.body2")}</p>
      </section>
    </>
  );
}
