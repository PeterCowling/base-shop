"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy FAQ overlay pending design/i18n overhaul */

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/components/atoms";

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
        question: "How do I place an order?",
        answer: (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Browse categories or search for a specific item, select your size, then add it to your bag.
              When you&apos;re ready, proceed to checkout.
            </p>
            <p>
              For the full step-by-step guide, visit{" "}
              <Link href="/pages/how-to-shop" className="underline text-foreground">
                How to shop
              </Link>
              .
            </p>
          </div>
        ),
      },
      {
        question: "Do I need an account to order?",
        answer: (
          <p className="text-sm text-muted-foreground">
            No. You can check out as a guest, but creating an account makes tracking, returns, and wishlists
            faster.
          </p>
        ),
      },
    ],
  },
  {
    title: "Orders & delivery",
    items: [
      {
        question: "How can I track my order?",
        answer: (
          <p className="text-sm text-muted-foreground">
            Use the{" "}
            <Link href="/account/trackingorder" className="underline text-foreground">
              order tracking
            </Link>{" "}
            page to check status without logging in.
          </p>
        ),
      },
      {
        question: "How long does delivery take?",
        answer: (
          <p className="text-sm text-muted-foreground">
            Timelines depend on your destination and the shipping method. See our{" "}
            <Link href="/pages/shipping-policy" className="underline text-foreground">
              Shipping policy
            </Link>{" "}
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
        question: "How do I start a return?",
        answer: (
          <p className="text-sm text-muted-foreground">
            Review eligibility and timelines on our{" "}
            <Link href="/pages/return-policy" className="underline text-foreground">
              Return policy
            </Link>{" "}
            and start the process from your orders page.
          </p>
        ),
      },
    ],
  },
  {
    title: "More help",
    items: [
      {
        question: "Where can I find more answers?",
        answer: (
          <p className="text-sm text-muted-foreground">
            Visit the full{" "}
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
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
