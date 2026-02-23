import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { ReceptionButton as Button, ReceptionInput } from "@acme/ui/operations";

import { useAuth } from "../../context/AuthContext";
import { withModalBackground } from "../../hoc/withModalBackground";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";

export interface PasswordReauthModalProps {
  title: string;
  instructions?: string;
  onSuccess: () => void;
  onCancel: () => void;
  hideCancel?: boolean;
}

function PasswordReauthModalBase({
  title,
  instructions,
  onSuccess,
  onCancel,
  hideCancel,
}: PasswordReauthModalProps) {
  const { reauthenticate } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      if (!password.trim() || isSubmitting) return;

      setIsSubmitting(true);
      setError("");

      const result = await reauthenticate(password);

      if (result.success) {
        setPassword("");
        onSuccess();
      } else {
        setError(result.error ?? "Authentication failed");
        setPassword("");
        inputRef.current?.focus();
      }

      setIsSubmitting(false);
    },
    [password, isSubmitting, reauthenticate, onSuccess]
  );

  return (
    <ModalContainer widthClasses="w-80">
      <h2 className="mb-4 text-center text-xl font-semibold dark:text-darkAccentGreen">
        {title}
      </h2>
      {instructions && (
        <p className="mb-4 text-center text-sm text-foreground dark:text-darkAccentGreen">
          {instructions}
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col items-center gap-3">
        <ReceptionInput
          ref={inputRef}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-center focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
        />
        {error && (
          <div className="text-sm text-error-main" role="alert">
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-center gap-2">
          {!hideCancel && (
            <Button
              type="button"
              onClick={onCancel}
              className="min-h-11 min-w-11 rounded bg-surface-3 px-4 py-2 text-foreground dark:bg-darkSurface dark:text-darkAccentOrange"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!password.trim() || isSubmitting}
            className="min-h-11 min-w-11 rounded bg-primary-main px-4 py-2 text-primary-fg disabled:opacity-50 dark:bg-darkAccentGreen"
          >
            {isSubmitting ? "Verifying..." : "Confirm"}
          </Button>
        </div>
      </form>
    </ModalContainer>
  );
}

PasswordReauthModalBase.displayName = "PasswordReauthModalBase";

export default withModalBackground(PasswordReauthModalBase);
