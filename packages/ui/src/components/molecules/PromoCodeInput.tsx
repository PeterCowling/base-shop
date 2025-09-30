/* i18n-exempt file -- UI-000: Non-user-facing literals (class names). All visible text uses i18n keys. */
"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Input } from "../atoms/shadcn";
import { useTranslations } from "@acme/i18n";

export interface PromoCodeInputProps
  extends React.HTMLAttributes<HTMLFormElement> {
  onApply?: (code: string) => void;
  loading?: boolean;
}

export const PromoCodeInput = React.forwardRef<
  HTMLFormElement,
  PromoCodeInputProps
>(({ onApply, loading = false, className, ...props }, ref) => {
  const t = useTranslations();
  const [code, setCode] = React.useState("");

  // Fallback to readable English when i18n messages are unavailable in tests
  const tf = (key: string, fallback: string) => {
    const val = t(key) as string;
    return val === key ? fallback : val;
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (onApply) onApply(code);
  }

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2", /* i18n-exempt -- UI-000: class names */
        className
      )}
      {...props}
      >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={tf("promo.code.placeholder", "Promo code")}
        className="flex-1" /* i18n-exempt -- UI-000: class names */
      />
      <Button type="submit" disabled={!code || loading}>
        {loading ? tf("actions.applying", "Applying...") : tf("actions.apply", "Apply")}
      </Button>
    </form>
  );
});
PromoCodeInput.displayName = "PromoCodeInput";
