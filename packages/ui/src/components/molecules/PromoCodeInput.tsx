import * as React from "react";
import { cn } from "../../utils/style";
import { Button, Input } from "../atoms/shadcn";

export interface PromoCodeInputProps
  extends React.HTMLAttributes<HTMLFormElement> {
  onApply?: (code: string) => void;
  loading?: boolean;
}

export const PromoCodeInput = React.forwardRef<
  HTMLFormElement,
  PromoCodeInputProps
>(({ onApply, loading = false, className, ...props }, ref) => {
  const [code, setCode] = React.useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (onApply) onApply(code);
  }

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Promo code"
        className="flex-1"
      />
      <Button type="submit" disabled={!code || loading}>
        {loading ? "Applying..." : "Apply"}
      </Button>
    </form>
  );
});
PromoCodeInput.displayName = "PromoCodeInput";
