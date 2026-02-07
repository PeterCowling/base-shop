import { SECTION_IDS } from "@/components/policies/terms-sale-eu/sectionIds";
import type { Translator } from "@/components/policies/terms-sale-eu/types";

type TermsOfSaleEuPartAProps = {
  bulletClassName: string;
  sectionClassName: string;
  t: Translator;
};

const definitionKeys = [
  "termsSale.scope.definitions.consumer",
  "termsSale.scope.definitions.goods",
  "termsSale.scope.definitions.order",
  "termsSale.scope.definitions.workingDay",
  "termsSale.scope.definitions.standardDelivery",
];

const productCategoryKeys = [
  "termsSale.products.categories.comfortBands",
  "termsSale.products.categories.sportWear",
  "termsSale.products.categories.waterWear",
  "termsSale.products.categories.spareLoops",
];

const cancellationReasons = [
  "termsSale.ordering.orderLimits.reasonUnavailable",
  "termsSale.ordering.orderLimits.reasonAddress",
  "termsSale.ordering.orderLimits.reasonPricingError",
  "termsSale.ordering.orderLimits.reasonFraud",
];

const paymentMethods = [
  "termsSale.payment.methods.cards",
  "termsSale.payment.methods.wallets",
];

export default function TermsOfSaleEuPartA({
  bulletClassName,
  sectionClassName,
  t,
}: TermsOfSaleEuPartAProps) {
  return (
    <>
      <section id={SECTION_IDS.scopeAndDefinitions} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.scope.title")}
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.scope.whoThese")}
        </h3>
        <p>{t("termsSale.scope.forConsumers")}</p>
        <p>{t("termsSale.scope.businessCustomers")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.scope.definitionsHeading")}
        </h3>
        <ul className={bulletClassName}>
          {definitionKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section id={SECTION_IDS.products} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.products.title")}
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.products.whatWeSell.heading")}
        </h3>
        <p>{t("termsSale.products.whatWeSell.body")}</p>
        <ul className={bulletClassName}>
          {productCategoryKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.products.compatibility.heading")}
        </h3>
        <p>{t("termsSale.products.compatibility.body")}</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.products.noMedical.heading")}
        </h3>
        <p>{t("termsSale.products.noMedical.body")}</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.products.patterns.heading")}
        </h3>
        <p>{t("termsSale.products.patterns.body")}</p>

        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.products.smallParts.heading")}
        </h3>
        <p>{t("termsSale.products.smallParts.body")}</p>
      </section>

      <section id={SECTION_IDS.ordering} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.ordering.title")}
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.ordering.placing.heading")}
        </h3>
        <p>{t("termsSale.ordering.placing.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.ordering.contractFormation.heading")}
        </h3>
        <p>{t("termsSale.ordering.contractFormation.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.ordering.orderLimits.heading")}
        </h3>
        <p>{t("termsSale.ordering.orderLimits.body")}</p>
        <ul className={bulletClassName}>
          {cancellationReasons.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <p>{t("termsSale.ordering.orderLimits.cancellationBody")}</p>
      </section>

      <section id={SECTION_IDS.pricesVatPromotions} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.prices.title")}
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.prices.currency.heading")}
        </h3>
        <p>{t("termsSale.prices.currency.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.prices.shipping.heading")}
        </h3>
        <p>{t("termsSale.prices.shipping.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.prices.promotions.heading")}
        </h3>
        <p>{t("termsSale.prices.promotions.body")}</p>
      </section>

      <section id={SECTION_IDS.payment} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.payment.title")}
        </h2>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.payment.methods.heading")}
        </h3>
        <p>{t("termsSale.payment.methods.body")}</p>
        <ul className={bulletClassName}>
          {paymentMethods.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <p>{t("termsSale.payment.methods.additional")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.payment.security.heading")}
        </h3>
        <p>{t("termsSale.payment.security.body")}</p>
      </section>
    </>
  );
}
