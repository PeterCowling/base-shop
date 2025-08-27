import * as React from "react";
import { MarketingEmailTemplateProps } from "./MarketingEmailTemplate";
export interface MarketingEmailTemplateVariant {
    id: string;
    name: string;
    render: (props: MarketingEmailTemplateProps) => React.ReactElement;
}
export declare const marketingEmailTemplates: MarketingEmailTemplateVariant[];
//# sourceMappingURL=marketingEmailTemplates.d.ts.map