import Link from "next/link";

import { SECTION_IDS } from "@/components/policies/terms-sale-eu/sectionIds";
import type { Translator } from "@/components/policies/terms-sale-eu/types";
import { withLocale } from "@/lib/routes";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import type { Locale } from "@/types/locale";

type TermsOfSaleEuIntroProps = {
  locale: Locale;
  linkClassName: string;
  sectionClassName: string;
  t: Translator;
};

const contents = [
  {
    href: `#${SECTION_IDS.sellerInformation}`,
    key: "termsSale.contents.sellerInformation",
  },
  {
    href: `#${SECTION_IDS.scopeAndDefinitions}`,
    key: "termsSale.contents.scopeAndDefinitions",
  },
  { href: `#${SECTION_IDS.products}`, key: "termsSale.contents.products" },
  { href: `#${SECTION_IDS.ordering}`, key: "termsSale.contents.ordering" },
  {
    href: `#${SECTION_IDS.pricesVatPromotions}`,
    key: "termsSale.contents.pricesVatPromotions",
  },
  { href: `#${SECTION_IDS.payment}`, key: "termsSale.contents.payment" },
  {
    href: `#${SECTION_IDS.deliveryShippingRestrictions}`,
    key: "termsSale.contents.deliveryShippingRestrictions",
  },
  { href: `#${SECTION_IDS.withdrawal}`, key: "termsSale.contents.withdrawal" },
  {
    href: `#${SECTION_IDS.returnsCondition}`,
    key: "termsSale.contents.returnsCondition",
  },
  { href: `#${SECTION_IDS.defective}`, key: "termsSale.contents.defective" },
  { href: `#${SECTION_IDS.returnsAddress}`, key: "termsSale.contents.returnsAddress" },
  { href: `#${SECTION_IDS.customerService}`, key: "termsSale.contents.customerService" },
  { href: `#${SECTION_IDS.liability}`, key: "termsSale.contents.liability" },
  { href: `#${SECTION_IDS.forceMajeure}`, key: "termsSale.contents.forceMajeure" },
  { href: `#${SECTION_IDS.governingLaw}`, key: "termsSale.contents.governingLaw" },
  { href: `#${SECTION_IDS.changes}`, key: "termsSale.contents.changes" },
  { href: `#${SECTION_IDS.annexA}`, key: "termsSale.contents.annexA" },
];

export default function TermsOfSaleEuIntro({
  locale,
  linkClassName,
  sectionClassName,
  t,
}: TermsOfSaleEuIntroProps) {
  return (
    <>
      <p>{t("termsSale.intro.lastUpdated")}</p>

      <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.intro.contents.title")}
        </div>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm">
          {contents.map((item) => (
            <li key={item.key}>
              <a href={item.href} className={linkClassName}>
                {t(item.key)}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <section id={SECTION_IDS.sellerInformation} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.seller.title")}
        </h2>
        <p>{t("termsSale.seller.body1")}</p>
        <p>{t("termsSale.seller.body2")}</p>

        <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              {t("termsSale.seller.companyName")}
            </div>
            <div>{t("termsSale.seller.addressLine1")}</div>
            <div>{t("termsSale.seller.vatNumber")}</div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("termsSale.seller.supportHeading")}
            </div>
            <div>
              {t("termsSale.seller.emailLabel")}{" "}
              <a className={linkClassName} href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div>
              {t("termsSale.seller.phoneLabel")} {SUPPORT_PHONE}
            </div>
            <div>
              {t("termsSale.seller.whatsappLabel")}{" "}
              <a
                className={linkClassName}
                href="https://wa.me/XXXXXXXXXXX"
                rel="noreferrer"
                target="_blank"
              >
                {t("termsSale.seller.whatsappLink")}
              </a>
            </div>
            <div>
              {t("termsSale.seller.contactLabel")}{" "}
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
