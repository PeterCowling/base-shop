/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy contact-us content pending design/i18n overhaul */
import Link from "next/link";

import { Section } from "@acme/design-system/atoms/Section";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives/Stack";

import { siteConfig } from "../../../lib/siteConfig";
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
        <div className="grid gap-12 md:grid-cols-[260px_1fr]">
          <ContactUsSidebar activeHref="/pages/contact-us" />

          <div className="min-w-0 space-y-10">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Customer Service
              </p>
              <h1 className="text-3xl font-semibold">Contact us</h1>
              <p className="text-sm text-muted-foreground">
                We usually respond within 24 hours. During busy periods, replies may take a little longer.
              </p>
            </div>

            <Grid columns={{ base: 1, md: 2 }} gap={6}>
              <div className="rounded-lg border p-6">
                <Stack gap={3}>
                  <div className="text-lg font-semibold">Email service hours</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Monday to Friday: 24 hours a day</p>
                    <p>Saturday and Sunday: 8am to 3pm EST</p>
                    {supportEmail ? <p>Support email: {supportEmail}</p> : null}
                  </div>
                </Stack>
              </div>

              <div className="rounded-lg border p-6">
                <Stack gap={3}>
                  <div className="text-lg font-semibold">Phone service hours</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Monday to Friday: 8am to 9pm EST</p>
                    {whatsappNumber ? <p>Call or WhatsApp: {whatsappNumber}</p> : null}
                    {!supportEmail && !whatsappNumber ? (
                      <p>Contact details are available on request.</p>
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
                    <p className="text-sm text-muted-foreground">
                      Find quick answers and step-by-step guides in our FAQ hub.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/faqs">Go to FAQs</Link>
                  </Button>
                </div>

                <div className="mt-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Quick actions
                  </h2>
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
                <h2 className="text-lg font-semibold">We’ll be in touch soon</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Scroll down for more ways to reach us. During peak periods you might experience longer
                  waiting times.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <h2 className="text-lg font-semibold">Step by step: cancel or return</h2>
                <Grid columns={{ base: 1, md: 2 }} gap={6} className="mt-4">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">To cancel your order</div>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                      {cancelSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="text-sm text-muted-foreground">
                      If an order is already prepared, it may no longer be cancellable, but you can still return it.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold">To return your order</div>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                      {returnSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                      Tip: At least one option will always be available — collection or drop-off.
                    </div>
                  </div>
                </Grid>

                <div className="mt-6 space-y-3">
                  <div className="text-sm font-semibold">Prepare your return</div>
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                    {prepareSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="text-sm text-muted-foreground">
                    Ask the courier to scan the label so you can track your return. If you need new labels, reprint
                    them from your order history.
                  </p>
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

            <Grid columns={{ base: 1, md: 2 }} gap={6}>
              <div className="rounded-lg border p-6 space-y-3">
                <div className="text-lg font-semibold">Tell us what you think</div>
                <p className="text-sm text-muted-foreground">Was this page helpful?</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline">Yes</Button>
                  <Button variant="outline">Not really</Button>
                </div>
              </div>
              <div className="rounded-lg border p-6 space-y-3">
                <div className="text-lg font-semibold">Never miss a thing</div>
                <p className="text-sm text-muted-foreground">
                  Sign up for promotions, new arrivals in {siteConfig.catalog.labelPlural}, stock updates, and more.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                  <Button className="sm:w-auto">Sign up</Button>
                </div>
              </div>
            </Grid>
          </div>
        </div>
      </Section>
    </main>
  );
}
