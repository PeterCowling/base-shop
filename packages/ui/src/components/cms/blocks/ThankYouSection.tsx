"use client";

import * as React from "react";
import ShowcaseSection from "./ShowcaseSection";

export interface ThankYouSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  headline?: string;
  message?: string;
  recommendationPreset?: "featured" | "new" | "bestsellers" | "clearance" | "limited";
}

export default function ThankYouSection({ headline = "Thank you for your purchase", message = "We’ve emailed your receipt and order details.", recommendationPreset = "featured", className, ...rest }: ThankYouSectionProps) {
  return (
    <section className={className} {...rest}>
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <h1 className="text-2xl font-semibold">{headline}</h1>
        <p className="text-neutral-700">{message}</p>
      </div>
      <div className="mt-8">
        <ShowcaseSection preset={recommendationPreset} layout="carousel" />
      </div>
    </section>
  );
}

