"use client";

import * as React from "react";
import { cn } from "../../../utils/style";
import { Button, Input } from "../../atoms";

export interface NotifyMeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  title: string;
  description?: string;
  emailLabel: string;
  emailPlaceholder?: string;
  ctaLabel: string;
  successMessage: string;
  mailto?: string;
  subject?: string;
  context?: string;
  onSubmit?: (payload: { email: string }) => Promise<void> | void;
}

export function NotifyMe({
  title,
  description,
  emailLabel,
  emailPlaceholder,
  ctaLabel,
  successMessage,
  mailto,
  subject,
  context,
  onSubmit,
  className,
  ...props
}: NotifyMeProps) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!email) return;
      setStatus("submitting");

      if (onSubmit) {
        await onSubmit({ email });
        setStatus("success");
        return;
      }

      if (mailto) {
        const parts = [email, context].filter(Boolean);
        const hrefParams = new URLSearchParams();
        if (subject) hrefParams.set("subject", subject);
        if (parts.length) hrefParams.set("body", parts.join("\n\n"));
        const href = `mailto:${encodeURIComponent(mailto)}${hrefParams.toString() ? `?${hrefParams.toString()}` : ""}`;
        window.location.href = href;
        setStatus("success");
        return;
      }

      setStatus("success");
    },
    [context, email, mailto, onSubmit, subject],
  );

  const inputId = React.useId();
  const isSubmitting = status === "submitting";

  return (
    <section
      className={cn(
        "rounded-3xl border border-border-1 bg-surface-2 p-5", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}

      {status === "success" ? (
        <div className="mt-4 rounded-2xl border border-border-1 bg-surface-1 p-4 text-sm text-foreground">
          {successMessage}
        </div>
      ) : (
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <div className="flex-1">
            <label htmlFor={inputId} className="sr-only">
              {emailLabel}
            </label>
            <Input
              id={inputId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              className="min-h-11 rounded-full"
            />
          </div>
          <Button
            type="submit"
            color="accent"
            tone="solid"
            className="min-h-11 rounded-full px-5"
            aria-busy={isSubmitting}
            disabled={!email || isSubmitting}
          >
            {ctaLabel}
          </Button>
        </form>
      )}
    </section>
  );
}
