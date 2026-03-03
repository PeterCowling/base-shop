import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { Stack } from "@acme/design-system/primitives/Stack";
import { FeedbackPreferenceCard } from "@acme/ui/components/organisms/FeedbackPreferenceCard";
import { SupportTwoColumnLayout } from "@acme/ui/components/organisms/SupportTwoColumnLayout";

import { siteConfig } from "../../../lib/siteConfig";
import { xaI18n } from "../../../lib/xaI18n";

import { ContactUsEnquiryForm } from "./ContactUsEnquiryForm";
import { ContactUsGeneralContacts } from "./ContactUsGeneralContacts";
import { ContactUsSidebar } from "./ContactUsSidebar";
import {
  buildPrepareSteps,
  cancelSteps,
  quickActions,
  returnSteps,
} from "./content";

function deriveEmail(localPart: string) {
  if (!siteConfig.showContactInfo) return "";
  const domain =
    siteConfig.supportEmail?.split("@")[1] ??
    siteConfig.domain?.replace(/^https?:\/\//, "") ??
    "example.com";
  return `${localPart}@${domain}`;
}

export default function ContactUsPage() {
  const supportEmail = siteConfig.showContactInfo ? siteConfig.supportEmail : "";
  const whatsappNumber = siteConfig.showSocialLinks ? siteConfig.whatsappNumber : "";
  const pressEmail = deriveEmail("press");
  const retailPartnersEmail = deriveEmail("retailpartners");
  const speakUpHref = "/pages/contact-us#speak-up";
  const prepareSteps = buildPrepareSteps(siteConfig.catalog.packagingItems);

  return (
    <main className="sf-content">
      <Section padding="wide">
        <SupportTwoColumnLayout sidebar={<ContactUsSidebar activeHref={xaI18n.t("xaB.src.app.pages.contact.us.page.l43c71")} />}>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l45c98")}</p>
              <h1 className="text-3xl font-semibold">Contact us</h1>
              <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l49c60")}</p>
            </div>

            <Grid columns={{ base: 1, md: 2 }} gap={6}>
              <div className="rounded-lg border p-6">
                <Stack gap={3}>
                  <div className="text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.page.l57c58")}</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{xaI18n.t("xaB.src.app.pages.contact.us.page.l59c24")}</p>
                    <p>{xaI18n.t("xaB.src.app.pages.contact.us.page.l60c24")}</p>
                    {supportEmail ? <p>{xaI18n.t("xaB.src.app.pages.contact.us.page.l61c40")}{supportEmail}</p> : null}
                  </div>
                </Stack>
              </div>

              <div className="rounded-lg border p-6">
                <Stack gap={3}>
                  <div className="text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.page.l68c58")}</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{xaI18n.t("xaB.src.app.pages.contact.us.page.l70c24")}</p>
                    {whatsappNumber ? <p>{xaI18n.t("xaB.src.app.pages.contact.us.page.l71c42")}{whatsappNumber}</p> : null}
                    {!supportEmail && !whatsappNumber ? (
                      <p>{xaI18n.t("xaB.src.app.pages.contact.us.page.l73c26")}</p>
                    ) : null}
                  </div>
                </Stack>
              </div>
            </Grid>

            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">FAQs</div>
                    <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l85c66")}</p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/faqs">Go to FAQs</Link>
                  </Button>
                </div>

                <div className="mt-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l95c103")}</h2>
                  <Grid columns={{ base: 1, md: 2 }} gap={4} className="mt-4">
                    {quickActions.map((action) => (
                      <div
                        key={action.label}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="text-sm font-medium">{action.label}</div>
                        <Button variant="ghost" asChild>
                          <Link href={action.href}>Open</Link>
                        </Button>
                      </div>
                    ))}
                  </Grid>
                </div>
              </div>

              <div className="rounded-lg border p-6">
                <h2 className="text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.page.l115c55")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l116c67")}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <h2 className="text-lg font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.page.l125c55")}</h2>
                <Grid columns={{ base: 1, md: 2 }} gap={6} className="mt-4">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.page.l128c60")}</div>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                      {cancelSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l134c66")}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.page.l140c60")}</div>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                      {returnSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l146c95")}</div>
                  </div>
                </Grid>

                <div className="mt-6 space-y-3">
                  <div className="text-sm font-semibold">{xaI18n.t("xaB.src.app.pages.contact.us.page.l153c58")}</div>
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                    {prepareSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.pages.contact.us.page.l159c64")}</p>
                </div>
              </div>
            </div>

            <Grid columns={{ base: 1, lg: 2 }} gap={8}>
              <ContactUsEnquiryForm supportEmail={supportEmail} />
              <ContactUsGeneralContacts
                supportEmail={supportEmail}
                whatsappNumber={whatsappNumber}
                pressEmail={pressEmail}
                retailPartnersEmail={retailPartnersEmail}
                speakUpHref={speakUpHref}
              />
            </Grid>

            <FeedbackPreferenceCard
              title="Tell us what you think"
              question={xaI18n.t("xaB.src.app.pages.contact.us.page.l181c26")}
              options={[
                { id: "yes", label: "Yes" },
                { id: "not-really", label: "Not really" },
              ]}
            />
        </SupportTwoColumnLayout>
      </Section>
    </main>
  );
}
