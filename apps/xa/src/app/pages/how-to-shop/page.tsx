/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy how-to content pending design/i18n overhaul */
import Link from "next/link";

import { Section } from "@acme/ui/atoms/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/components/atoms";
import { siteConfig } from "../../../lib/siteConfig";

export default function HowToShopPage() {
  const brandName = siteConfig.brandName;
  const productDescriptor = siteConfig.catalog.productDescriptor;
  const sidebarLinks = [
    { label: "Contact us", href: "/pages/contact-us" },
    { label: "How to shop", href: "#" },
    { label: "Orders and delivery", href: "/pages/shipping-policy" },
    { label: "Payment and pricing", href: "/pages/payment-and-pricing" },
    { label: "Cryptocurrency payments", href: "/pages/cryptocurrency-payment" },
    { label: "Returns and refunds", href: "/pages/return-policy" },
    { label: "FAQs", href: "/faqs" },
    { label: "Terms and conditions", href: "/pages/terms-of-service" },
    { label: "Privacy policy", href: "/pages/privacy-policy" },
    { label: "Modern slavery statement", href: "/pages/terms-of-service" },
    { label: "Accessibility", href: "/pages/contact-us" },
    { label: "Cookie preferences", href: "/pages/privacy-policy#cookies" },
    {
      label: "Promotions terms & conditions",
      href: "/pages/payment-and-pricing#promotions",
    },
  ];

  return (
    <main className="sf-content">
      <Section padding="wide">
        <div className="grid gap-12 md:grid-cols-[260px_1fr]">
          <div className="space-y-2 text-sm uppercase tracking-wide text-foreground">
            {sidebarLinks.map((item) => (
              <div key={item.label} className="leading-relaxed">
                <Link
                  href={item.href}
                  className="text-base font-medium normal-case underline"
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer noopener" : undefined}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="min-w-0 space-y-10">
            <h1 className="text-3xl font-semibold">How to shop</h1>

            <Accordion type="multiple" className="divide-y">
              <AccordionItem value="about">
                <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold">
                  About us
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-6 text-sm text-muted-foreground">
                  <p>
                    When you shop at {brandName}, you&apos;re shopping {productDescriptor} from luxury brands and
                    boutiques around the globe.
                  </p>
                  <p>
                    Our brand and partner boutiques are located worldwide, and our unique marketplace guarantees you a huge
                    range of items to shop. From established luxury brands to the most interesting new designers, shop unique
                    styles you won&apos;t find anywhere else. We deliver to over 190 countries worldwide so you&apos;ll receive your
                    order before you know it.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="find">
                <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold">
                  How to find items
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-6 text-sm text-muted-foreground">
                  <p>
                    The easiest way is to browse using the drop-down navigation menus at the top of the page, where you can
                    find links to new items, brands, categories and edits. If you know what you are looking for, use the
                    search box at the top right.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="order">
                <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold">
                  How to order and pay
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-6 text-sm text-muted-foreground">
                  <p>
                    Once you&apos;ve found what you&apos;re looking for, select your size and click Add To Bag. You can
                    continue shopping and add more items to your bag, or proceed straight to checkout.
                  </p>
                  <p>
                    Our checkout process is quick and straightforward. You can either create an account or proceed using our
                    guest checkout. No matter how many items you have in your shopping bag or how many brand or
                    partner boutiques they are sourced from, you only need to check out once.
                  </p>
                  <p>
                    We ship worldwide via DHL, with services from UPS in selected countries. Please choose your delivery
                    preference for each brand or partner boutique, then proceed to payment and select your payment
                    method. We accept all major credit and debit cards, as well as PayPal, Klarna, Afterpay and selected
                    cryptocurrencies. For a full list of payment methods,{" "}
                    <Link
                      href="/pages/payment-and-pricing"
                      className="text-foreground underline"
                    >
                      go to Payment &amp; Pricing
                    </Link>
                    .
                  </p>
                  <p>
                    Once you have placed your order, you will receive a confirmation email. Your order will then be sent
                    directly to you.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Tell us what you think</div>
              <h2 className="text-2xl font-semibold">Was this content helpful?</h2>
              <div className="flex flex-wrap gap-3 text-xs font-semibold">
                <span className="rounded-full border px-4 py-2">Yes</span>
                <span className="rounded-full border px-4 py-2">Not really</span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Never miss a thing</h2>
              <p className="text-sm text-muted-foreground">
                Sign up for promotions, tailored new arrivals, stock updates and more - straight to your inbox
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Get updates by</div>
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-foreground">
                  Email
                </div>
                <div className="inline-flex min-w-[120px] items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold text-muted-foreground">
                  Sign Up
                </div>
                <p className="text-xs">
                  By signing up, you consent to receiving marketing by email and/or SMS and acknowledge you have read our{" "}
                  <Link href="/pages/privacy-policy" className="text-foreground underline">
                    Privacy Policy
                  </Link>
                  . Unsubscribe anytime at the bottom of our emails or by replying STOP to any of our SMS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
