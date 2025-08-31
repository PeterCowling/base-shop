import * as React from "react";
import { MarketingEmailTemplate, MarketingEmailTemplateProps } from "./MarketingEmailTemplate";

export interface MarketingEmailTemplateVariant {
  id: string;
  label: string;
  buildSubject: (headline: string) => string;
  make: (props: MarketingEmailTemplateProps) => React.ReactElement;
}

export const marketingEmailTemplates: MarketingEmailTemplateVariant[] = [
  {
    id: "basic",
    label: "Basic",
    buildSubject: (headline) => headline,
    make: (props) => <MarketingEmailTemplate {...props} />,
  },
  {
    id: "centered",
    label: "Centered",
    buildSubject: (headline) => headline,
    make: (props) => (
      <MarketingEmailTemplate {...props} className="text-center" />
    ),
  },
];
