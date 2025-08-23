import * as React from "react";
export interface AnnouncementBarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Message text displayed in the bar */
    text?: string;
    /** Optional URL the bar links to */
    href?: string;
    /** Whether to show a close button */
    closable?: boolean;
}
/**
 * Simple announcement bar that can display a message with an optional link
 * and close button. When `href` is provided the entire bar becomes a link.
 */
export default function AnnouncementBar({ text, href, closable, className, ...props }: AnnouncementBarProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=AnnouncementBar.d.ts.map