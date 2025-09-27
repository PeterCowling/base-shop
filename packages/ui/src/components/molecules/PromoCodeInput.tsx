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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (onApply) onApply(code);
  }

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", /* i18n-exempt: class names */ className)}
      {...props}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("Promo code") as string}
        className="flex-1"
      />
      <Button type="submit" disabled={!code || loading}>
        {loading ? (t("Applying...") as string) : (t("Apply") as string)}
      </Button>
    </form>
  );
});
PromoCodeInput.displayName = "PromoCodeInput";
