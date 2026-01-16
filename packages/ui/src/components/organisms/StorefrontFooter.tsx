import * as React from "react";
import Link from "next/link";
import { cn } from "../../utils/style";
import { Grid } from "../atoms/primitives/Grid";
import { Stack } from "../atoms/primitives/Stack";

export interface StorefrontFooterLink {
  label: string;
  href: string;
}

export interface StorefrontFooterGroup {
  title: string;
  links: StorefrontFooterLink[];
}

export interface StorefrontFooterProps
  extends React.HTMLAttributes<HTMLElement> {
  brandName: string;
  groups: StorefrontFooterGroup[];
  aside?: React.ReactNode;
}

export function StorefrontFooter({
  brandName,
  groups,
  aside,
  className,
  ...props
}: StorefrontFooterProps) {
  // i18n-exempt -- XA-0003: class tokens only
  const FOOTER_CLASS = "border-t bg-surface-1";
  return (
    <footer className={cn(FOOTER_CLASS, className)} {...props}>
      <div className="mx-auto w-full px-4 py-10">
        <Grid cols={4} gap={8} className="grid-cols-2 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="text-lg font-semibold">{brandName}</div>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <Stack gap={2}>
                <div className="text-sm font-semibold">{group.title}</div>
                <Stack gap={1}>
                  {group.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="inline-flex min-h-11 min-w-11 items-center text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {l.label}
                    </Link>
                  ))}
                </Stack>
              </Stack>
            </div>
          ))}
          {aside ? <div className="col-span-2 md:col-span-1">{aside}</div> : null}
        </Grid>
      </div>
    </footer>
  );
}
