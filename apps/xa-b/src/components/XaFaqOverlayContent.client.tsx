"use client";


import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/design-system/atoms";

import { xaI18n } from "../lib/xaI18n";

type QaItem = {
  question: string;
  answer: React.ReactNode;
};

type QaSection = {
  title: string;
  items: QaItem[];
};

const qaSections: QaSection[] = [
  {
    title: "How to shop",
    items: [
      {
        question: xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l28c19"),
        answer: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l31c16")}</p>
            <p>{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l35c16")}{" "}
              <Link href="/pages/how-to-shop" className="underline text-foreground">
                How to shop
              </Link>
              .
            </p>
          </div>
        ),
      },
      {
        question: xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l46c19"),
        answer: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l48c56")}</p>
        ),
      },
    ],
  },
  {
    title: xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l57c12"),
    items: [
      {
        question: xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l60c19"),
        answer: (
          <p className="text-sm text-muted-foreground">
            Use the{" "}
            <Link href="/service-center" className="underline text-foreground">{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l64c87")}</Link>{" "}{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l66c25")}</p>
        ),
      },
      {
        question: xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l72c19"),
        answer: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l74c56")}{" "}
            <Link href="/pages/shipping-policy" className="underline text-foreground">{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l76c87")}</Link>{" "}
            for details.
          </p>
        ),
      },
    ],
  },
  {
    title: "Returns",
    items: [
      {
        question: xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l89c19"),
        answer: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l91c56")}{" "}
            <Link href="/pages/return-policy" className="underline text-foreground">{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l93c85")}</Link>{" "}{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l95c25")}</p>
        ),
      },
    ],
  },
  {
    title: "More help",
    items: [
      {
        question: xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l106c19"),
        answer: (
          <p className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.components.xafaqoverlaycontent.client.l108c56")}{" "}
            <Link href="/faqs" className="underline text-foreground">
              FAQs page
            </Link>{" "}
            or{" "}
            <Link href="/pages/contact-us" className="underline text-foreground">
              contact us
            </Link>{" "}
            for support.
          </p>
        ),
      },
    ],
  },
];

function toSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function XaFaqOverlayContent() {
  return (
    <div className="space-y-10">
      {qaSections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase xa-tracking-018 text-muted-foreground">
            {section.title}
          </h2>
          <Accordion type="multiple">
            {section.items.map((item) => {
              const value = `${toSlug(section.title)}-${toSlug(item.question)}`;
              return (
                <AccordionItem key={value} value={value} className="rounded-none border-x-0 border-t-0">
                  <AccordionTrigger className="rounded-none px-0 py-4 text-base font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-6">{item.answer}</AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
