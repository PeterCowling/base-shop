import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";
import { FeedbackPreferenceCard } from "@acme/ui/components/organisms/FeedbackPreferenceCard";
import { NewsletterInterestCard } from "@acme/ui/components/organisms/NewsletterInterestCard";
import { SupportSidebarNav } from "@acme/ui/components/organisms/SupportSidebarNav";
import { SupportTwoColumnLayout } from "@acme/ui/components/organisms/SupportTwoColumnLayout";

import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

export default function HowToShopPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const sidebarLinks = [
    { label: "Contact us", href: "/pages/contact-us" },
    { label: "How to shop", href: "#" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l23c14"), href: "/pages/shipping-policy" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l24c14"), href: "/pages/payment-and-pricing" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l25c14"), href: "/pages/cryptocurrency-payment" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l26c14"), href: "/pages/return-policy" },
    { label: "FAQs", href: "/faqs" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l28c14"), href: "/pages/terms-of-service" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l29c14"), href: "/pages/privacy-policy" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l30c14"), href: "/pages/terms-of-service" },
    { label: "Accessibility", href: "/pages/contact-us" },
    { label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l32c14"), href: "/pages/privacy-policy#cookies" },
    {
      label: xaI18n.t("xaB.src.app.pages.how.to.shop.page.l34c14"),
      href: "/pages/payment-and-pricing#promotions",
    },
  ];

  return (
    <main className="sf-content">
      <Section padding="wide">
        <SupportTwoColumnLayout
          sidebar={
            <SupportSidebarNav
              items={sidebarLinks}
              activeHref="#"
              variant="underline"
              sticky={false}
            />
          }
        >
            <h1 className="text-3xl font-semibold">How to shop</h1>

            <Accordion type="multiple" className="divide-y">
              <AccordionItem value="about">
                <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold">
                  About us
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-6 text-sm text-muted-foreground">
                  <p>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l60c22")}{brandName}{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l61c49")}{productDescriptor}{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l61c91")}</p>
                  <p>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l64c22")}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="find">
                <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l74c108")}</AccordionTrigger>
                <AccordionContent className="space-y-2 pb-6 text-sm text-muted-foreground">
                  <p>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l78c22")}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="order">
                <AccordionTrigger className="w-full justify-between py-4 text-start text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l87c108")}</AccordionTrigger>
                <AccordionContent className="space-y-3 pb-6 text-sm text-muted-foreground">
                  <p>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l91c22")}</p>
                  <p>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l95c22")}</p>
                  <p>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l100c22")}{" "}
                    <Link
                      href="/pages/payment-and-pricing"
                      className="text-foreground underline"
                    >{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l108c22")}</Link>
                    .
                  </p>
                  <p>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l113c22")}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <FeedbackPreferenceCard
              interactive={false}
              className="space-y-2 border-0 p-0"
              title="Tell us what you think"
              titleClassName={xaI18n.t("xaB.src.app.pages.how.to.shop.page.l125c30")}
              question={xaI18n.t("xaB.src.app.pages.how.to.shop.page.l126c24")}
              questionClassName={xaI18n.t("xaB.src.app.pages.how.to.shop.page.l127c33")}
              options={[
                { id: "yes", label: "Yes" },
                { id: "not-really", label: "Not really" },
              ]}
              optionsClassName={xaI18n.t("xaB.src.app.pages.how.to.shop.page.l132c32")}
            />

            <NewsletterInterestCard
              title="Never miss a thing"
              description={xaI18n.t("xaB.src.app.pages.how.to.shop.page.l137c27")}
              channelLabel={xaI18n.t("xaB.src.app.pages.how.to.shop.page.l138c28")}
              channelValue="Email"
              ctaLabel="Sign Up"
              legalNote={
                <>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l142c19")}{" "}
                  <Link href="/pages/privacy-policy" className="text-foreground underline">{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l145c92")}</Link>{xaI18n.t("xaB.src.app.pages.how.to.shop.page.l147c26")}</>
              }
            />
        </SupportTwoColumnLayout>
      </Section>
    </main>
  );
}
