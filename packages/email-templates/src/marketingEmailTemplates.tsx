import * as React from "react";
import { MarketingEmailTemplate, MarketingEmailTemplateProps } from "./MarketingEmailTemplate";

export interface MarketingEmailTemplateVariant {
  id: string;
  name: string;
  render: (props: MarketingEmailTemplateProps) => React.ReactElement;
}

export const marketingEmailTemplates: MarketingEmailTemplateVariant[] = [
  {
    id: "basic",
    name: "Basic",
    render: (props) => <MarketingEmailTemplate {...props} />,
  },
  {
    id: "centered",
    name: "Centered",
    render: (props) => (
      <MarketingEmailTemplate {...props} className="text-center" />
    ),
  },
];
