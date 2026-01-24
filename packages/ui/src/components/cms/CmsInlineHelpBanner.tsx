// packages/ui/src/components/cms/CmsInlineHelpBanner.tsx

import type { ReactElement } from "react";

import { Alert, Button } from "../../components/atoms";
import { Inline } from "../../components/atoms/primitives/Inline";

export type CmsInlineHelpTone = "info" | "warning";

export interface CmsInlineHelpLink {
  id: string;
  label: string;
  href: string;
  onClick?: () => void;
}

export interface CmsInlineHelpBannerProps {
  heading?: string;
  body: string;
  links: CmsInlineHelpLink[];
  tone?: CmsInlineHelpTone;
}

export function CmsInlineHelpBanner({
  heading,
  body,
  links,
  tone = "info",
}: CmsInlineHelpBannerProps): ReactElement {
  const variant = tone === "warning" ? "warning" : "info";

  return (
    <Alert variant={variant} tone="soft" heading={heading}>
      <Inline
        alignY="center"
        wrap
        gap={2}
        className="justify-between"
      >
        <p className="text-sm text-muted-foreground">
          {body}
        </p>
        <Inline gap={2} wrap alignY="center">
          {links.map((link) => (
            <Button
              key={link.id}
              type="button"
              variant="outline"
              onClick={link.onClick}
              asChild
            >
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
        </Inline>
      </Inline>
    </Alert>
  );
}

export default CmsInlineHelpBanner;
