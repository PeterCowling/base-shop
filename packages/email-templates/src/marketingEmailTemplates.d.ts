import * as React from "react";

import { MarketingEmailTemplateProps } from "./MarketingEmailTemplate";

export interface MarketingEmailTemplateVariant {
    id: string;
    label: string;
    buildSubject: (headline: string) => string;
    make: (props: MarketingEmailTemplateProps) => React.ReactElement;
}
export declare const marketingEmailTemplates: MarketingEmailTemplateVariant[];
//# sourceMappingURL=marketingEmailTemplates.d.ts.map