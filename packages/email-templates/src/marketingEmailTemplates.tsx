import * as React from "react";

import { MarketingEmailTemplate, type MarketingEmailTemplateProps } from "./MarketingEmailTemplate";

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
    make: (props) => {
      if (!props || !props.headline || props.content == null) {
        return <></>;
      }
      return <MarketingEmailTemplate {...(props ?? {})} />;
    },
  },
  {
    id: "centered",
    label: "Centered",
    buildSubject: (headline) => headline,
    make: (props) => {
      if (!props || !props.headline || props.content == null) {
        return <></>;
      }
      return (
        <MarketingEmailTemplate {...(props ?? {})} className="text-center" />
      );
    },
  },
];
