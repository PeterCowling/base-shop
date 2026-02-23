import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { Breadcrumbs } from "@acme/design-system/molecules";
import { Inline } from "@acme/design-system/primitives/Inline";
import { ResourceCard } from "@acme/ui/components/organisms/ResourceCard";
import { SupportSidebarNav } from "@acme/ui/components/organisms/SupportSidebarNav";

import { siteConfig } from "../../lib/siteConfig";
import { toWhatsappHref } from "../../lib/support";
import { xaI18n } from "../../lib/xaI18n";

export default function ServiceCenterPage() {
  const productLabelPlural = siteConfig.catalog.labelPlural;
  const whatsappHref = siteConfig.showSocialLinks
    ? toWhatsappHref(siteConfig.whatsappNumber)
    : null;
  const showContactCard = siteConfig.showContactInfo || siteConfig.showSocialLinks;
  const navLinks = [
    { href: "#orders", label: xaI18n.t("xaB.src.app.service.center.page.l21c31") },
    { href: "#shipping", label: "Shipping" },
    { href: "#returns", label: "Returns" },
    { href: "#company", label: xaI18n.t("xaB.src.app.service.center.page.l24c32") },
  ];

  return (
    <main className="sf-content">
      <Section padding="default">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: xaI18n.t("xaB.src.app.service.center.page.l31c58") }]}
        />
      </Section>

      <Section padding="wide">
        <h1 className="text-3xl font-semibold">{xaI18n.t("xaB.src.app.service.center.page.l36c48")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.service.center.page.l37c59")}{productLabelPlural}.
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
            <ResourceCard title="Order help" description={xaI18n.t("xaB.src.app.service.center.page.l53c58")}>
              <Button asChild>
                <Link href="/account/trackingorder">{xaI18n.t("xaB.src.app.service.center.page.l55c53")}</Link>
              </Button>
              {siteConfig.showContactInfo ? (
                <div className="text-xs text-muted-foreground">{xaI18n.t("xaB.src.app.service.center.page.l58c64")}</div>
              ) : null}
            </ResourceCard>

            {showContactCard ? (
              <ResourceCard
                title="Contact"
                description={xaI18n.t("xaB.src.app.service.center.page.l67c29")}
              >
                <Inline gap={3} className="flex-wrap">
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
                </Inline>
                  {siteConfig.showContactInfo && siteConfig.businessHours ? (
                    <div className="text-xs text-muted-foreground">{xaI18n.t("xaB.src.app.service.center.page.l91c68")}{siteConfig.businessHours}
                    </div>
                  ) : null}
              </ResourceCard>
            ) : (
              <ResourceCard
                title="Contact"
                description={xaI18n.t("xaB.src.app.service.center.page.l99c29")}
              />
            )}

            <ResourceCard
              title="How to shop"
              description={xaI18n.t("xaB.src.app.service.center.page.l105c27")}
            >
              <Button variant="outline" asChild>
                <Link href="/pages/how-to-shop">View guide</Link>
              </Button>
            </ResourceCard>

            <ResourceCard
              id="shipping"
              className="scroll-mt-28"
              title="Shipping"
              description={xaI18n.t("xaB.src.app.service.center.page.l116c27")}
            >
              <Button variant="outline" asChild>
                <Link href="/pages/shipping-policy">{xaI18n.t("xaB.src.app.service.center.page.l119c53")}</Link>
              </Button>
            </ResourceCard>

            <ResourceCard
              id="returns"
              className="scroll-mt-28"
              title="Returns"
              description={xaI18n.t("xaB.src.app.service.center.page.l127c27")}
            >
              <Button variant="outline" asChild>
                <Link href="/pages/return-policy">{xaI18n.t("xaB.src.app.service.center.page.l130c51")}</Link>
              </Button>
            </ResourceCard>

            <ResourceCard
              title="FAQs"
              description={xaI18n.t("xaB.src.app.service.center.page.l136c27")}
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
          <Inline gap={3} className="mt-3 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/pages/about-us">About us</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages/privacy-policy">{xaI18n.t("xaB.src.app.service.center.page.l153c50")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages/terms-of-service">{xaI18n.t("xaB.src.app.service.center.page.l156c52")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pages/contact-us">Contact us</Link>
            </Button>
          </Inline>
        </ResourceCard>
      </Section>
    </main>
  );
}
