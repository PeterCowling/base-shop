import React from "react";
export interface SocialLinksProps extends React.HTMLAttributes<HTMLDivElement> {
    facebook?: string;
    instagram?: string;
    x?: string;
    youtube?: string;
    linkedin?: string;
}
export default function SocialLinks({ facebook, instagram, x, youtube, linkedin, className, ...rest }: SocialLinksProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=SocialLinks.d.ts.map