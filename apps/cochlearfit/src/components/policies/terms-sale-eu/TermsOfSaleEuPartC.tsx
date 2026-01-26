import { SECTION_IDS } from "@/components/policies/terms-sale-eu/sectionIds";
import type { Translator } from "@/components/policies/terms-sale-eu/types";
import { SUPPORT_EMAIL } from "@/lib/site";

type TermsOfSaleEuPartCProps = {
  bulletClassName: string;
  linkClassName: string;
  sectionClassName: string;
  t: Translator;
};

const liabilityBullets = [
  "termsSale.liability.bullets.forceMajeure",
  "termsSale.liability.bullets.carriers",
];

export default function TermsOfSaleEuPartC({
  bulletClassName,
  linkClassName,
  sectionClassName,
  t,
}: TermsOfSaleEuPartCProps) {
  return (
    <>
      <section id={SECTION_IDS.returnsAddress} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.returnsAddress.title")}
        </h2>
        <p>{t("termsSale.returnsAddress.body")}</p>
        <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              {t("termsSale.returnsAddress.companyName")}
            </div>
            <div>{t("termsSale.returnsAddress.addressLine1")}</div>
            <div>{t("termsSale.returnsAddress.addressLine2")}</div>
            <div>{t("termsSale.returnsAddress.addressLine3")}</div>
          </div>
        </div>
        <p>{t("termsSale.returnsAddress.instructions")}</p>
      </section>

      <section id={SECTION_IDS.customerService} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.customerService.title")}
        </h2>
        <p>{t("termsSale.customerService.body")}</p>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("termsSale.customerService.odr.heading")}
        </h3>
        <p>{t("termsSale.customerService.odr.body")}</p>
      </section>

      <section id={SECTION_IDS.liability} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.liability.title")}
        </h2>
        <p>{t("termsSale.liability.body")}</p>
        <p>{t("termsSale.liability.subjectTo")}</p>
        <ul className={bulletClassName}>
          {liabilityBullets.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section id={SECTION_IDS.forceMajeure} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.forceMajeure.title")}
        </h2>
        <p>{t("termsSale.forceMajeure.body")}</p>
      </section>

      <section id={SECTION_IDS.governingLaw} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.governingLaw.title")}
        </h2>
        <p>{t("termsSale.governingLaw.body1")}</p>
        <p>{t("termsSale.governingLaw.body2")}</p>
      </section>

      <section id={SECTION_IDS.changes} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.changes.title")}
        </h2>
        <p>{t("termsSale.changes.body")}</p>
      </section>

      <section id={SECTION_IDS.annexA} className={sectionClassName}>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t("termsSale.annex.title")}
        </h2>
        <p>{t("termsSale.annex.intro")}</p>
        <div className="rounded-3xl border border-border-1 bg-surface-2 p-5">
          <div className="space-y-2">
            <p>
              {t("termsSale.annex.to")}{" "}
              <a className={linkClassName} href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p>{t("termsSale.annex.goodsLine")}</p>
            <p>{t("termsSale.annex.underline")}</p>
            <p>{t("termsSale.annex.orderedLine")}</p>
            <p>{t("termsSale.annex.nameLine")}</p>
            <p>{t("termsSale.annex.addressLine")}</p>
            <p>{t("termsSale.annex.signatureLine")}</p>
            <p>{t("termsSale.annex.dateLine")}</p>
            <p className="text-xs text-muted-foreground">{t("termsSale.annex.note")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
