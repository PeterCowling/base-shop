import * as React from "react";
export interface Error500TemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    /** URL to navigate to when the user chooses to go back home. */
    homeHref?: string;
}
export declare function Error500Template({ homeHref, className, ...props }: Error500TemplateProps): React.JSX.Element;
