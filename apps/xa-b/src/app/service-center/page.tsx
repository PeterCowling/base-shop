import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { Breadcrumbs } from "@acme/design-system/molecules";
import { ResourceCard } from "@acme/ui/components/organisms/ResourceCard";
import { SupportSidebarNav } from "@acme/ui/components/organisms/SupportSidebarNav";

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
            <SupportSidebarNav
              title="Browse help"
              items={navLinks}
              variant="pill"
            />
          </aside>

          <div className="md:col-span-3 space-y-6 scroll-mt-28" id="orders">
            <ResourceCard title="Order help" description="Track your order without logging in.">
              <Button asChild>
                <Link href="/account/trackingorder">Check order status</Link>
              </Button>
              {siteConfig.showContactInfo ? (
                <div className="text-xs text-muted-foreground">
                  Prefer email? Include your order number and email address.
                </div>
              ) : null}
            </ResourceCard>

            {showContactCard ? (
              <ResourceCard
                title="Contact"
                description="Choose a channel and we’ll route you to the right team."
              >
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
              </ResourceCard>
            ) : (
              <ResourceCard
                title="Contact"
                description="Contact details are available on request."
              />
            )}

            <ResourceCard
              title="How to shop"
              description="Browse, order, and pay following our step-by-step guide."
            >
              <Button variant="outline" asChild>
                <Link href="/pages/how-to-shop">View guide</Link>
              </Button>
            </ResourceCard>

            <ResourceCard
              id="shipping"
              className="scroll-mt-28"
              title="Shipping"
              description="Processing times, methods, and delivery windows."
            >
              <Button variant="outline" asChild>
                <Link href="/pages/shipping-policy">Shipping policy</Link>
              </Button>
            </ResourceCard>

            <ResourceCard
              id="returns"
              className="scroll-mt-28"
              title="Returns"
              description="What’s refundable, timelines, and how to start a return."
            >
              <Button variant="outline" asChild>
                <Link href="/pages/return-policy">Return policy</Link>
              </Button>
            </ResourceCard>

            <ResourceCard
              title="FAQs"
              description="Detailed answers for shopping, delivery, payments, and returns."
            >
              <Button variant="outline" asChild>
                <Link href="/faqs">View FAQs</Link>
              </Button>
            </ResourceCard>
          </div>
        </Grid>
      </Section>

      <Section padding="default" id="company" className="scroll-mt-28">
        <ResourceCard title="Company & legal">
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
        </ResourceCard>
      </Section>
    </main>
  );
}
