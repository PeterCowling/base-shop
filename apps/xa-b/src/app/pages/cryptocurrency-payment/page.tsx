import type { ReactNode } from "react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { LegalEntityCard } from "@acme/ui/components/organisms/LegalEntityCard";
import { PolicyContent } from "@acme/ui/components/organisms/PolicyContent";
import { PolicyPageIntro } from "@acme/ui/components/organisms/PolicyPageIntro";

import { XaInlineLink } from "../../../components/XaInlineLink";
import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

const LAST_UPDATED = xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l18c22");

type CryptocurrencyPaymentBodyProps = {
  contactEmailLink: ReactNode;
};

function CryptocurrencyPaymentBody({
  contactEmailLink,
}: CryptocurrencyPaymentBodyProps) {
  return (
    <PolicyContent className="space-y-10">
      <Accordion type="multiple" className="divide-y">
        <AccordionItem value="availability">
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">
            Availability
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l35c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l40c16")}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="supported">
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l48c118")}</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l52c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l57c16")}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="how-it-works">
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l65c118")}</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <ol className="list-decimal space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l70c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l71c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l75c19")}</li>
              <li>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l79c19")}</li>
            </ol>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l84c16")}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value={xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l91c30")}>
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l92c118")}</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l96c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l104c51")}</span>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l104c71")}</li>
              <li>
                <span className="text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l108c51")}</span>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l108c72")}</li>
              <li>
                <span className="text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l112c51")}</span>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l112c78")}</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="confirmation">
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l120c118")}</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l124c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l129c16")}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="refunds">
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l138c118")}</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l142c16")}{" "}
              <Link className="underline text-foreground" href="/pages/return-policy">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l144c87")}</Link>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l146c22")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l150c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l155c16")}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l163c118")}</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l167c16")}</p>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l172c16")}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="more">
          <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold text-foreground">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l180c118")}</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-6">
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l184c16")}{" "}
              <Link className="underline text-foreground" href="/pages/terms-of-service">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l186c90")}</Link>{" "}
              and our{" "}
              <Link className="underline text-foreground" href="/pages/privacy-policy">{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l190c88")}</Link>
              .
            </p>
            <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l195c16")}{" "}
              <Link className="underline text-foreground" href="/pages/contact-us">
                contact page
              </Link>
              {contactEmailLink ? <> or email {contactEmailLink}</> : null}.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <LegalEntityCard title="Need help?">
        <p>{xaI18n.t("xaB.src.app.pages.cryptocurrency.payment.page.l207c12")}{" "}
          <Link className="underline text-foreground" href="/pages/contact-us">
            contact page
          </Link>
          {contactEmailLink ? <> or email {contactEmailLink}</> : null}.
        </p>
      </LegalEntityCard>
    </PolicyContent>
  );
}

export default function CryptocurrencyPaymentPage() {
  const brandName = siteConfig.brandName;
  const contactEmailLink = siteConfig.showContactInfo && siteConfig.supportEmail ? (
    <XaInlineLink href={`mailto:${siteConfig.supportEmail}`} className="underline">
      {siteConfig.supportEmail}
    </XaInlineLink>
  ) : null;

  return (
    <main className="sf-content">
      <Section padding="wide">
        <PolicyPageIntro
          title="Cryptocurrency payments"
          description={`Where available, you can pay for orders on ${brandName} using cryptocurrency. Crypto payments are processed through a third-party payment provider. We do not store your wallet keys or have access to your funds.`}
          lastUpdated={`Last updated: ${LAST_UPDATED}`}
        />
      </Section>
      <Section padding="default">
        <CryptocurrencyPaymentBody contactEmailLink={contactEmailLink} />
      </Section>
    </main>
  );
}
