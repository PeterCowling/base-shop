import { type FormEvent, memo, useCallback, useEffect, useRef, useState } from "react";

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
      <h2 className="mb-2 text-center text-xl font-semibold dark:text-darkAccentGreen">
        Manager Sign-off Required
      </h2>
      <p className="mb-4 text-center text-sm text-gray-700 dark:text-darkAccentGreen">
        Variance detected: €{varianceAmount.toFixed(2)}. A manager must sign off
        before closing this shift.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          ref={emailRef}
          type="email"
          autoComplete="username"
          placeholder="Manager email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Manager password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
        />
        <textarea
          rows={3}
          placeholder="Variance note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
        />
        {error && (
          <div className="text-sm text-error-main" role="alert">
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 min-w-11 rounded bg-gray-300 px-4 py-2 text-gray-800 dark:bg-darkSurface dark:text-darkAccentOrange"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 min-w-11 rounded bg-primary-main px-4 py-2 text-white disabled:opacity-50 dark:bg-darkAccentGreen"
          >
            {isSubmitting ? "Verifying..." : "Sign off"}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
}

VarianceSignoffModalBase.displayName = "VarianceSignoffModalBase";

export default withModalBackground(memo(VarianceSignoffModalBase));
