import { type FormEvent, memo, useCallback, useEffect, useRef, useState } from "react";

import { Input, Textarea } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { withModalBackground } from "../../hoc/withModalBackground";
import { getUserDisplayName } from "../../lib/roles";
import { verifyManagerCredentials } from "../../services/managerReauth";
import type { VarianceSignoff } from "../../types/component/Till";
import { getItalyIsoString } from "../../utils/dateUtils";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";

interface VarianceSignoffModalProps {
  shiftOwnerName: string;
  shiftOwnerUid?: string;
  varianceAmount: number;
  onConfirm: (signoff: VarianceSignoff) => void;
  onCancel: () => void;
}

function VarianceSignoffModalBase({
  shiftOwnerName,
  shiftOwnerUid,
  varianceAmount,
  onConfirm,
  onCancel,
}: VarianceSignoffModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      if (isSubmitting) return;
      if (!email.trim() || !password.trim()) {
        setError("Email and password are required.");
        return;
      }
      if (!note.trim()) {
        setError("Variance note is required.");
        return;
      }

      setIsSubmitting(true);
      setError("");

      const result = await verifyManagerCredentials(email, password);
      if (!result.success || !result.user) {
        setError(result.error ?? "Authentication failed.");
        setIsSubmitting(false);
        return;
      }

      const managerUid = result.user.uid;
      const managerName = getUserDisplayName(result.user);
      if (
        (shiftOwnerUid && managerUid && managerUid === shiftOwnerUid) ||
        (!shiftOwnerUid && managerName === shiftOwnerName)
      ) {
        setError("A different manager must sign off on this variance.");
        setIsSubmitting(false);
        return;
      }

      onConfirm({
        signedOffBy: managerName,
        signedOffByUid: managerUid,
        signedOffAt: getItalyIsoString(),
        varianceNote: note.trim(),
      });

      showToast("Variance sign-off recorded.", "success");
    },
    [
      email,
      password,
      note,
      isSubmitting,
      shiftOwnerUid,
      shiftOwnerName,
      onConfirm,
    ]
  );

  return (
    <ModalContainer widthClasses="w-[26rem]">
      <h2 className="mb-2 text-center text-xl font-semibold">
        Manager Sign-off Required
      </h2>
      <p className="mb-4 text-center text-sm text-foreground">
        Variance detected: €{varianceAmount.toFixed(2)}. A manager must sign off
        before closing this shift.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          compatibilityMode="no-wrapper"
          ref={emailRef}
          type="email"
          autoComplete="username"
          placeholder="Manager email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-center"
        />
        <Input
          compatibilityMode="no-wrapper"
          type="password"
          autoComplete="current-password"
          placeholder="Manager password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-center"
        />
        <Textarea
          compatibilityMode="no-wrapper"
          rows={3}
          placeholder="Variance note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-sm"
        />
        {error && (
          <div className="text-sm text-error-main" role="alert">
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-center gap-2">
          <Button
            type="button"
            onClick={onCancel}
            className="min-h-11 min-w-11 rounded bg-surface-3 px-4 py-2 text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 min-w-11 rounded bg-primary-main px-4 py-2 text-primary-fg disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Sign off"}
          </Button>
        </div>
      </form>
    </ModalContainer>
  );
}

VarianceSignoffModalBase.displayName = "VarianceSignoffModalBase";

export default withModalBackground(memo(VarianceSignoffModalBase));
