/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy landing content pending design/i18n overhaul */
import Link from "next/link";
import type { SVGProps } from "react";
import { ChatBubbleIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";

import { Section } from "@acme/ui/atoms/Section";
import { Grid } from "@acme/ui/atoms/Grid";
import { Button } from "@acme/ui/components/atoms";

import { XaFadeImage } from "../components/XaFadeImage";
import { XaProductCard } from "../components/XaProductCard";
import { XA_PRODUCTS } from "../lib/demoData";
import { siteConfig } from "../lib/siteConfig";

const heroImage =
  "https://images.unsplash.com/photo-1501348291533-cb233b7d4cc0?auto=format&fit=crop&w=1400&q=80";

function HangerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4a2 2 0 0 0-2 2v1.2a3.2 3.2 0 0 0 2 2.97l.8.33c1.08.45 1.2.6 1.2 1.15V15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 17.5c0-.7.43-1.33 1.08-1.59l6.35-2.54c.36-.14.76-.14 1.12 0l6.35 2.54c.65.26 1.08.89 1.08 1.59v.5H4v-.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const catalog = siteConfig.catalog;
  const newInProducts = [...XA_PRODUCTS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  return (
    <main className="sf-content">
      <Section padding="wide" className="pt-10">
        <div className="grid items-center gap-12 md:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)]">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="xa-hero-title">
                Member rewards for {catalog.productDescriptor}
              </h1>
              <p className="xa-hero-copy text-muted-foreground">
                Get early access, member pricing, and curated edits across {catalog.labelPlural}. The more you shop,
                the more you get.
              </p>
            </div>
            <Button
              asChild
              className="xa-hero-cta rounded-none bg-black px-6 text-white hover:bg-neutral-900"
            >
              <Link href="/account/register">Join Us</Link>
            </Button>
          </div>
          <div className="xa-hero-media w-full md:justify-self-end md:max-w-[560px]">
            <div className="p-6 md:p-10">
              <div className="relative aspect-[4/5] w-full">
                <XaFadeImage
                  src={heroImage}
                  alt="Two models in seasonal looks"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section padding="default">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">
            New in:{" "}
            <span className="font-normal text-muted-foreground">
              handpicked daily {catalog.labelPlural} from the world&apos;s best brands and boutiques
            </span>
          </h2>
          <Button variant="outline" asChild>
            <Link href="/new-in">Shop now</Link>
          </Button>
        </div>

        <div className="mt-6">
          <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
            {newInProducts.map((p) => (
              <XaProductCard key={p.slug} product={p} />
            ))}
          </Grid>
        </div>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 1, md: 3 }} gap={6}>
          <Link
            href="/pages/how-to-shop"
            className="group flex h-full flex-col gap-2 border p-6 hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="text-muted-foreground">
              <HangerIcon className="h-6 w-6" />
            </div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              How to shop
            </div>
            <div className="text-sm text-muted-foreground">
              Your guide to shopping and placing orders
            </div>
          </Link>

          <Link
            href="/faqs"
            className="group flex h-full flex-col gap-2 border p-6 hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="text-muted-foreground">
              <QuestionMarkCircledIcon className="h-6 w-6" />
            </div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              FAQs
            </div>
            <div className="text-sm text-muted-foreground">Your questions answered</div>
          </Link>

          <Link
            href="/pages/contact-us"
            className="group flex h-full flex-col gap-2 border p-6 hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="text-muted-foreground">
              <ChatBubbleIcon className="h-6 w-6" />
            </div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">
              Need help?
            </div>
            <div className="text-sm text-muted-foreground">
              Contact our global Customer Service team
            </div>
          </Link>
        </Grid>
      </Section>
    </main>
  );
}
