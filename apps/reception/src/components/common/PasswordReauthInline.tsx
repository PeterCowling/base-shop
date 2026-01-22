import {
  type FormEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Enter your password to confirm
      </label>
      <input
        ref={inputRef}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        disabled={isSubmitting}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
      />
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!password.trim() || isSubmitting}
        className="min-h-11 min-w-11 w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/90"
      >
        {isSubmitting ? "Verifying..." : submitLabel}
      </button>
    </form>
  );
});

export default PasswordReauthInline;
