import type { ReactNode } from "react";
import Link from "next/link";

import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import Accordion from "@acme/design-system/molecules/Accordion";
import { Stack } from "@acme/design-system/primitives/Stack";
import { FeedbackPreferenceCard } from "@acme/ui/components/organisms/FeedbackPreferenceCard";
import { NewsletterSignupCard } from "@acme/ui/components/organisms/NewsletterSignupCard";

import { XaInlineLink } from "../../components/XaInlineLink";
import { siteConfig } from "../../lib/siteConfig";
import { xaI18n } from "../../lib/xaI18n";

type FaqItem = {
  question: string;
  content: ReactNode;
};

type FaqSection = {
  title: string;
  items: FaqItem[];
};

const brandName = siteConfig.brandName;
const productDescriptor = siteConfig.catalog.productDescriptor;
const packagingItems = siteConfig.catalog.packagingItems;

const faqSections: FaqSection[] = [
  {
    title: xaI18n.t("xaB.src.app.faqs.page.l30c12"),
    items: [
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l33c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l36c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l37c16")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l38c100")}</p>
            <p>
              <XaInlineLink
                href="/pages/how-to-shop"
                className="text-foreground underline"
              >{xaI18n.t("xaB.src.app.faqs.page.l47c16")}</XaInlineLink>
              .
            </p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l56c19"),
        content: (
          <p className="text-sm text-muted-foreground">
            Follow the{" "}
            <Link href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l60c63")}</Link>{" "}{xaI18n.t("xaB.src.app.faqs.page.l62c25")}</p>
        ),
      },
      {
        question: `How do I receive ${brandName} email updates?`,
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l71c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l78c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Here is how:</div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.faqs.page.l83c19")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l84c19")}<span className="font-semibold">Add To Bag</span>{xaI18n.t("xaB.src.app.faqs.page.l85c93")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l88c19")}</li>
            </ol>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l90c16")}</p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l98c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l100c56")}</p>
        ),
      },
      {
        question: `Can I cancel my ${brandName} order or make changes to it?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l109c16")}{" "}
              <Link href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l111c59")}</Link>{xaI18n.t("xaB.src.app.faqs.page.l113c22")}{" "}
              <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l115c81")}</XaInlineLink>
              .
            </p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l120c16")}{" "}
              <XaInlineLink href="/pages/shipping-policy" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l123c81")}</XaInlineLink>
              .
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: `${brandName} pricing and payment`,
    items: [
      {
        question: `Why is ${brandName} pricing different?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l140c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l145c16")}</p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l153c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l155c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l163c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l165c56")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l166c76")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l172c19"),
        content: (
          <div className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.faqs.page.l176c19")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l177c19")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l178c19")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l183c19")}<XaInlineLink
                  href="/pages/cryptocurrency-payment"
                  className="underline text-foreground"
                >{xaI18n.t("xaB.src.app.faqs.page.l188c18")}</XaInlineLink>
                )
              </li>
            </ul>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l194c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l198c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l204c16")}</p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l209c19"),
        content: (
            <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l211c58")}{" "}
              <XaInlineLink href="/pages/privacy-policy" className="underline">
              View the {brandName}{xaI18n.t("xaB.src.app.faqs.page.l215c35")}</XaInlineLink>
              .
            </p>
        ),
      },
    ],
  },
  {
    title: xaI18n.t("xaB.src.app.faqs.page.l224c12"),
    items: [
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l227c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l229c56")}{" "}
            <span className="font-semibold text-foreground">size missing</span>{xaI18n.t("xaB.src.app.faqs.page.l231c80")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l237c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l239c56")}</p>
        ),
      },
      {
        question: `Are ${brandName} items guaranteed authentic?`,
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l247c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l254c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l256c56")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l257c58")}{" "}
            {packagingItems}{xaI18n.t("xaB.src.app.faqs.page.l258c29")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l263c19"),
        content: (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l266c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.faqs.page.l269c65")}</span>{xaI18n.t("xaB.src.app.faqs.page.l269c89")}</li>
              <li>
                <span className="font-semibold text-foreground">Unworn:</span>{xaI18n.t("xaB.src.app.faqs.page.l273c79")}</li>
              <li>
                <span className="font-semibold text-foreground">Excellent:</span>{xaI18n.t("xaB.src.app.faqs.page.l277c82")}</li>
              <li>
                <span className="font-semibold text-foreground">Good:</span>{xaI18n.t("xaB.src.app.faqs.page.l281c77")}</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    title: xaI18n.t("xaB.src.app.faqs.page.l291c12"),
    items: [
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l294c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l296c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l304c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l307c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l311c16")}<Link href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l313c62")}</Link>{xaI18n.t("xaB.src.app.faqs.page.l313c89")}{" "}
              <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l315c81")}</XaInlineLink>
              .
            </p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l324c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {brandName}{xaI18n.t("xaB.src.app.faqs.page.l328c26")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l335c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l339c16")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l340c40")}{" "}
              <XaInlineLink href="/pages/shipping-policy" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l343c81")}</XaInlineLink>
              .
            </p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l352c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l354c56")}{" "}
            <XaInlineLink href="/pages/contact-us" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l358c74")}</XaInlineLink>
            .
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l366c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l368c56")}{" "}
            <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l371c79")}</XaInlineLink>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: xaI18n.t("xaB.src.app.faqs.page.l381c12"),
    items: [
      {
        question: `What is the ${brandName} returns policy?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l387c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l391c16")}{" "}
              <XaInlineLink href="https://triple-a.io/" className="underline">
                TripleA
              </XaInlineLink>{" "}{xaI18n.t("xaB.src.app.faqs.page.l395c35")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l399c16")}<Link href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l400c77")}</Link>{" "}{xaI18n.t("xaB.src.app.faqs.page.l400c109")}{" "}
              <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l402c81")}</XaInlineLink>{xaI18n.t("xaB.src.app.faqs.page.l404c30")}{packagingItems}{xaI18n.t("xaB.src.app.faqs.page.l406c85")}{" "}
              <XaInlineLink href="/pages/return-policy" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l408c79")}</XaInlineLink>
              .
            </p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l417c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l420c16")}<Link href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l421c79")}</Link>{" "}{xaI18n.t("xaB.src.app.faqs.page.l421c111")}{" "}
              <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l423c81")}</XaInlineLink>
              .
            </p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l428c16")}</p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l437c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l439c56")}{brandName} package.
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l446c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{xaI18n.t("xaB.src.app.faqs.page.l449c58")}</div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Go to <Link href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l452c67")}</Link>{xaI18n.t("xaB.src.app.faqs.page.l452c94")}{" "}
                <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l454c83")}</XaInlineLink>
                .
              </li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l459c19")}</li>
            </ol>
            <p className="font-medium text-foreground">{xaI18n.t("xaB.src.app.faqs.page.l461c56")}</p>
            <div className="space-y-1">
              <div className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.faqs.page.l465c62")}</div>
              <p>{xaI18n.t("xaB.src.app.faqs.page.l466c18")}</p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.faqs.page.l469c62")}</div>
              <p>{xaI18n.t("xaB.src.app.faqs.page.l470c18")}</p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-foreground">{xaI18n.t("xaB.src.app.faqs.page.l476c62")}</div>
              <ol className="list-decimal space-y-1 pl-5">
                <li>{xaI18n.t("xaB.src.app.faqs.page.l478c21")}{packagingItems} inside the {brandName} packaging.
                </li>
                <li>{xaI18n.t("xaB.src.app.faqs.page.l481c21")}</li>
                <li>{xaI18n.t("xaB.src.app.faqs.page.l482c21")}</li>
              </ol>
              <p>{xaI18n.t("xaB.src.app.faqs.page.l487c18")}</p>
            </div>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l497c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l500c16")}</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.faqs.page.l502c19")}{packagingItems}{xaI18n.t("xaB.src.app.faqs.page.l503c69")}{brandName} packaging.
              </li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l505c19")}</li>
            </ol>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l510c16")}{" "}
              <XaInlineLink href="/pages/return-policy" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l513c79")}</XaInlineLink>
              .
            </p>
          </div>
        ),
      },
      {
        question: `Does my order need to be returned in the ${brandName} package it arrived in?`,
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l524c56")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l525c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l531c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l533c56")}{" "}
            <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l536c79")}</XaInlineLink>
            .
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l544c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l547c16")}</p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l551c16")}</p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l559c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l561c56")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l563c43")}{brandName}.
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l569c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l571c56")}</p>
        ),
      },
    ],
  },
  {
    title: "Pre-order",
    items: [
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l582c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l584c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l590c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l592c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l599c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l601c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l605c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l608c16")}</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Go to <Link href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l611c67")}</Link>{xaI18n.t("xaB.src.app.faqs.page.l611c94")}{" "}
                <XaInlineLink href="/service-center" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l612c83")}</XaInlineLink>
                .
              </li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l617c19")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l618c19")}</li>
            </ol>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l620c16")}</p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l627c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l629c56")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l630c52")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l636c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l638c56")}{" "}
            <XaInlineLink href="/pages/return-policy" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l640c77")}</XaInlineLink>
            .
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l648c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l650c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l656c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l658c56")}</p>
        ),
      },
    ],
  },
  {
    title: "Size and fit",
    items: [
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l669c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l671c56")}<span className="font-semibold text-foreground">Size Guide</span>{xaI18n.t("xaB.src.app.faqs.page.l672c106")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l678c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l680c56")}<span className="font-semibold text-foreground">Size &amp; Fit</span>{" "}{xaI18n.t("xaB.src.app.faqs.page.l681c117")}{" "}
            <span className="font-semibold text-foreground">The Details</span> tab.
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l688c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l690c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l697c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l699c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l706c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l708c56")}{" "}
            <XaInlineLink href="/pages/contact-us" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l710c74")}</XaInlineLink>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: "Promotions",
    items: [
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l723c19"),
        content: (
          <p className="text-sm text-muted-foreground">
            <XaInlineLink href="#newsletter" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l726c68")}</XaInlineLink>{" "}{xaI18n.t("xaB.src.app.faqs.page.l728c33")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l734c19"),
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l737c16")}{" "}
              <XaInlineLink href="/pages/payment-and-pricing#promotions" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l739c96")}</XaInlineLink>
              .
            </p>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l744c16")}</p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l749c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l751c56")}{" "}
            <XaInlineLink href="/pages/contact-us" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l754c74")}</XaInlineLink>
            .
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l762c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l764c56")}{" "}
            <XaInlineLink href="/pages/payment-and-pricing#promotions" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l767c94")}</XaInlineLink>{" "}
            for details.
          </p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l775c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l777c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l784c19"),
        content: (
          <p className="text-sm text-muted-foreground">
            {brandName}{xaI18n.t("xaB.src.app.faqs.page.l787c24")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l793c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l795c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l801c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l803c56")}</p>
        ),
      },
    ],
  },
  {
    title: xaI18n.t("xaB.src.app.faqs.page.l812c12"),
    items: [
      {
        question: `Who is the ${brandName} Legal Representative for the purposes of the DSA?`,
        content: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {brandName}{xaI18n.t("xaB.src.app.faqs.page.l819c26")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.faqs.page.l823c19")}</li>
              <li>
                Post: {brandName}{xaI18n.t("xaB.src.app.faqs.page.l825c34")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l827c19")}</li>
            </ul>
            <p>{xaI18n.t("xaB.src.app.faqs.page.l829c16")}</p>
          </div>
        ),
      },
      {
        question: `What is the average number of active recipients of services on the ${brandName} Marketplace in the EEA?`,
        content: (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.app.faqs.page.l840c16")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{xaI18n.t("xaB.src.app.faqs.page.l842c19")}</li>
              <li>{xaI18n.t("xaB.src.app.faqs.page.l843c19")}</li>
            </ul>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l849c19"),
        content: (
          <p className="text-sm text-muted-foreground">
            {brandName}{xaI18n.t("xaB.src.app.faqs.page.l852c24")}</p>
        ),
      },
      {
        question: "Tax Strategy",
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l860c56")}{brandName} Tax Strategy{" "}
            <XaInlineLink
              href="/pages/terms-of-service"
              className="underline"
            >
              here
            </XaInlineLink>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: xaI18n.t("xaB.src.app.faqs.page.l875c12"),
    items: [
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l878c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l880c56")}{brandName}{xaI18n.t("xaB.src.app.faqs.page.l881c88")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l887c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l889c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l896c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l898c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l905c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l907c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l914c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l916c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l923c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l925c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l932c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l934c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l941c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l943c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l950c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l952c56")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.app.faqs.page.l959c19"),
        content: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l961c56")}</p>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  const toSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";

  return (
    <main className="sf-content">
      <Section padding="wide" className="max-w-3xl space-y-3">
        <p className="text-xs uppercase xa-tracking-020 text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l980c80")}</p>
        <h1 className="text-3xl font-semibold">FAQs</h1>
        <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l982c54")}{" "}
          {productDescriptor}{xaI18n.t("xaB.src.app.faqs.page.l984c30")}{brandName}.
        </p>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 1, md: 4 }} gap={10}>
          <aside className="md:col-span-1">
            <div className="sticky top-28 space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">{xaI18n.t("xaB.src.app.faqs.page.l992c76")}</div>
              <Stack gap={2}>
                {faqSections.map((section) => {
                  const id = toSlug(section.title);
                  return (
                    <XaInlineLink
                      key={section.title}
                      href={`#${id}`}
                      className="rounded border px-3 py-2 text-sm hover:border-foreground hover:text-foreground"
                    >
                      {section.title}
                    </XaInlineLink>
                  );
                })}
              </Stack>
            </div>
          </aside>

          <div className="md:col-span-3 space-y-12">
            {faqSections.map((section) => {
              const id = toSlug(section.title);
              return (
                <div key={section.title} className="space-y-4 scroll-mt-28" id={id}>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  <Accordion
                    items={section.items.map((item) => ({
                      title: item.question,
                      content: item.content,
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </Grid>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 1, md: 2 }} gap={6}>
          <FeedbackPreferenceCard
            id="newsletter"
            className="p-5"
            title="Tell us what you think"
            question={xaI18n.t("xaB.src.app.faqs.page.l1035c22")}
            options={[
              { id: "yes", label: "Yes" },
              { id: "not-really", label: "Not really" },
            ]}
          />
          <NewsletterSignupCard
            className="p-5"
            title="Never miss a thing"
            description={xaI18n.t("xaB.src.app.faqs.page.l1044c25")}
            legalNote={
              <>{xaI18n.t("xaB.src.app.faqs.page.l1046c17")}{" "}
                <XaInlineLink href="/pages/privacy-policy" className="underline">{xaI18n.t("xaB.src.app.faqs.page.l1048c82")}</XaInlineLink>{xaI18n.t("xaB.src.app.faqs.page.l1050c32")}</>
            }
          />
        </Grid>
      </Section>
    </main>
  );
}
