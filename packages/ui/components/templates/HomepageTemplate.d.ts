import * as React from "react";
export interface HomepageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Hero section displayed at the top of the page */
    hero?: React.ReactNode;
    /** Section for recommended products or content */
    recommendations?: React.ReactNode;
    /** Additional page content */
    children?: React.ReactNode;
}
/**
 * Basic homepage layout with slots for a hero area and a
 * recommendations section.
 */
export declare function HomepageTemplate({ hero, recommendations, children, className, ...props }: HomepageTemplateProps): React.JSX.Element;
