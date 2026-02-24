import * as React from "react";

import { cn } from "../../utils/style";
import { Button } from "../atoms/primitives/button";
import { Input } from "../atoms/primitives/input";

export interface NewsletterSignupCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description: React.ReactNode;
  inputPlaceholder?: string;
  submitLabel?: React.ReactNode;
  legalNote?: React.ReactNode;
  inputName?: string;
  inputType?: string;
}

export function NewsletterSignupCard({
  title,
  description,
  inputPlaceholder = "Email", // i18n-exempt -- UI-NEWSLETTER-001 fallback placeholder
  submitLabel = "Sign up", // i18n-exempt -- UI-NEWSLETTER-002 fallback label
  legalNote,
  inputName = "email",
  inputType = "email",
  className,
  ...props
}: NewsletterSignupCardProps) {
  return (
    <div className={cn("rounded-lg border p-6 space-y-3", className)} {...props}>
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type={inputType}
          name={inputName}
          placeholder={inputPlaceholder}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        <Button className="sm:w-auto">{submitLabel}</Button>
      </div>
      {legalNote ? <p className="text-xs text-muted-foreground">{legalNote}</p> : null}
    </div>
  );
}
