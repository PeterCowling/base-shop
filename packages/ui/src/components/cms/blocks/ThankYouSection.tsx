"use client";

import * as React from "react";
import { useTranslations } from "@acme/i18n";
import ShowcaseSection from "./ShowcaseSection";
import Section from "./Section";

export interface ThankYouSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  headline?: string;
  message?: string;
  recommendationPreset?: "featured" | "new" | "bestsellers" | "clearance" | "limited";
}

export default function ThankYouSection({ headline, message, recommendationPreset = "featured", className, ...rest }: ThankYouSectionProps) {
  const t = useTranslations();
  const computedHeadline = headline ?? t("thankYou.headline");
  const computedMessage = message ?? t("thankYou.message");
  return (
    <Section className={className} contentWidth="narrow" contentAlign="center" {...rest}>
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold">{computedHeadline}</h1>
        <p className="text-neutral-700">{computedMessage}</p>
      </div>
      <div className="mt-8">
        <ShowcaseSection preset={recommendationPreset} layout="carousel" />
      </div>
    </Section>
  );
}
