import {
  type FormEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { useAuth } from "../../context/AuthContext";

export interface PasswordReauthInlineProps {
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
}

export const PasswordReauthInline = memo(function PasswordReauthInline({
  onSubmit,
  submitLabel = "Confirm",
}: PasswordReauthInlineProps) {
  const { reauthenticate } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!password.trim() || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      const result = await reauthenticate(password);

      if (result.success) {
        setPassword("");
        await onSubmit();
      } else {
        setError(result.error ?? "Authentication failed");
        setPassword("");
        inputRef.current?.focus();
      }

      setIsSubmitting(false);
    },
    [password, isSubmitting, reauthenticate, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
      <label className="text-sm font-medium text-foreground">
        Enter your password to confirm
      </label>
      <Input
        compatibilityMode="no-wrapper"
        ref={inputRef}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        disabled={isSubmitting}
        className="w-full rounded-lg border border-border-2 px-4 py-2 text-center disabled:opacity-50"
      />
      {error && (
        <p role="alert" className="text-sm font-medium text-error-main">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!password.trim() || isSubmitting}
        color="primary"
        tone="solid"
        size="lg"
        className="min-h-11 min-w-11 w-full"
      >
        {isSubmitting ? "Verifying..." : submitLabel}
      </Button>
    </form>
  );
});

export default PasswordReauthInline;
