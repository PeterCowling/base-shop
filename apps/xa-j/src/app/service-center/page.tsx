import Link from "next/link";

import { Grid } from "@acme/ui/atoms/Grid";
/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy service center content pending design/i18n overhaul */
import { Section } from "@acme/ui/atoms/Section";
import { Button } from "@acme/ui/components/atoms";
import { Stack } from "@acme/ui/components/atoms/primitives/Stack";
import { Breadcrumbs } from "@acme/ui/components/molecules";

import { siteConfig } from "../../lib/siteConfig";
import { toWhatsappHref } from "../../lib/support";

export default function ServiceCenterPage() {
  const productLabelPlural = siteConfig.catalog.labelPlural;
  const whatsappHref = siteConfig.showSocialLinks
    ? toWhatsappHref(siteConfig.whatsappNumber)
    : null;
  const showContactCard = siteConfig.showContactInfo || siteConfig.showSocialLinks;
  const navLinks = [
    { href: "#orders", label: "Orders & contact" },
    { href: "#shipping", label: "Shipping" },
    { href: "#returns", label: "Returns" },
    { href: "#company", label: "Company & legal" },
  ];

  return (
    <main className="sf-content">
      <Section padding="default">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Service center" }]}
        />
      </Section>

      <Section padding="wide">
        <h1 className="text-3xl font-semibold">Service center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quick help with orders, shipping, returns, and support for {productLabelPlural}.
        </p>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 1, md: 4 }} gap={8}>
          <aside className="md:col-span-1">
            <div className="sticky top-28 space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">Browse help</div>
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded border px-3 py-2 text-sm hover:border-foreground hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="md:col-span-3 space-y-6 scroll-mt-28" id="orders">
            <div className="rounded-lg border p-5">
            <Stack gap={3}>
              <div className="text-sm font-semibold">Order help</div>
              <div className="text-sm text-muted-foreground">
                Track your order without logging in.
              </div>
              <Button asChild>
                <Link href="/account/trackingorder">Check order status</Link>
              </Button>
              {siteConfig.showContactInfo ? (
                <div className="text-xs text-muted-foreground">
                  Prefer email? Include your order number and email address.
                </div>
              ) : null}
            </Stack>
          </div>

            {showContactCard ? (
              <div className="rounded-lg border p-5">
                <Stack gap={3}>
                  <div className="text-sm font-semibold">Contact</div>
                  <div className="text-sm text-muted-foreground">
                    Choose a channel and we’ll route you to the right team.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {whatsappHref ? (
                      <Button variant="outline" asChild>
                        <a href={whatsappHref} target="_blank" rel="noreferrer noopener">
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                    {siteConfig.showContactInfo && siteConfig.supportEmail ? (
                      <Button variant="outline" asChild>
                        <a href={`mailto:${siteConfig.supportEmail}`}>Email</a>
                      </Button>
                    ) : null}
                    {siteConfig.showSocialLinks && siteConfig.instagramUrl ? (
                      <Button variant="outline" asChild>
                        <a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer noopener">
                          Instagram
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {siteConfig.showContactInfo && siteConfig.businessHours ? (
                    <div className="text-xs text-muted-foreground">
                      Business hours: {siteConfig.businessHours}
                    </div>
                  ) : null}
                </Stack>
              </div>
            ) : (
              <div className="rounded-lg border p-5">
                <Stack gap={3}>
                  <div className="text-sm font-semibold">Contact</div>
                  <div className="text-sm text-muted-foreground">
                    Contact details are available on request.
                  </div>
                </Stack>
              </div>
            )}

            <div className="rounded-lg border p-5">
              <Stack gap={3}>
                <div className="text-sm font-semibold">How to shop</div>
                <div className="text-sm text-muted-foreground">
                  Browse, order, and pay following our step-by-step guide.
                </div>
                <Button variant="outline" asChild>
                  <Link href="/pages/how-to-shop">View guide</Link>
                </Button>
              </Stack>
            </div>

            <div className="rounded-lg border p-5 scroll-mt-28" id="shipping">
              <Stack gap={3}>
                <div className="text-sm font-semibold">Shipping</div>
                <div className="text-sm text-muted-foreground">
                  Processing times, methods, and delivery windows.
                </div>
                <Button variant="outline" asChild>
                  <Link href="/pages/shipping-policy">Shipping policy</Link>
                </Button>
              </Stack>
            </div>

            <div className="rounded-lg border p-5 scroll-mt-28" id="returns">
              <Stack gap={3}>
                <div className="text-sm font-semibold">Returns</div>
                <div className="text-sm text-muted-foreground">
                  What’s refundable, timelines, and how to start a return.
                </div>
                <Button variant="outline" asChild>
                  <Link href="/pages/return-policy">Return policy</Link>
                </Button>
              </Stack>
            </div>

            <div className="rounded-lg border p-5">
              <Stack gap={3}>
                <div className="text-sm font-semibold">FAQs</div>
                <div className="text-sm text-muted-foreground">
                  Detailed answers for shopping, delivery, payments, and returns.
                </div>
                <Button variant="outline" asChild>
                  <Link href="/faqs">View FAQs</Link>
                </Button>
              </Stack>
            </div>
          </div>
        </Grid>
      </Section>

      <Section padding="default" id="company" className="scroll-mt-28">
        <div className="rounded-lg border p-5">
          <div className="text-sm font-semibold">Company & legal</div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/pages/about-us">About us</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages/privacy-policy">Privacy policy</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages/terms-of-service">Terms of service</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages/contact-us">Contact us</Link>
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
