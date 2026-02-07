import TermsOfSaleEuIntro from "@/components/policies/terms-sale-eu/TermsOfSaleEuIntro";
import TermsOfSaleEuPartA from "@/components/policies/terms-sale-eu/TermsOfSaleEuPartA";
import TermsOfSaleEuPartB from "@/components/policies/terms-sale-eu/TermsOfSaleEuPartB";
import TermsOfSaleEuPartC from "@/components/policies/terms-sale-eu/TermsOfSaleEuPartC";
import type { Translator } from "@/components/policies/terms-sale-eu/types";
import type { Locale } from "@/types/locale";

type TermsOfSaleEuContentProps = {
  locale: Locale;
  t: Translator;
};

export default function TermsOfSaleEuContent({ locale, t }: TermsOfSaleEuContentProps) {
  const linkClassName = [
    "text-link",
    "underline",
    "decoration-primary/40",
    "underline-offset-4",
    "transition",
    "hover:text-accent",
    "focus-visible:focus-ring",
  ].join(" ");
  const sectionClassName = ["scroll-mt-28", "space-y-4"].join(" ");
  const bulletClassName = ["ms-4", "list-disc", "space-y-2", "text-sm", "text-muted-foreground"].join(" ");

  return (
    <div className="mt-6 space-y-10 text-sm text-muted-foreground">
      <TermsOfSaleEuIntro
        locale={locale}
        linkClassName={linkClassName}
        sectionClassName={sectionClassName}
        t={t}
      />
      <TermsOfSaleEuPartA
        bulletClassName={bulletClassName}
        sectionClassName={sectionClassName}
        t={t}
      />
      <TermsOfSaleEuPartB
        locale={locale}
        t={t}
        bulletClassName={bulletClassName}
        linkClassName={linkClassName}
        sectionClassName={sectionClassName}
      />
      <TermsOfSaleEuPartC
        bulletClassName={bulletClassName}
        linkClassName={linkClassName}
        sectionClassName={sectionClassName}
        t={t}
      />
    </div>
  );
}
