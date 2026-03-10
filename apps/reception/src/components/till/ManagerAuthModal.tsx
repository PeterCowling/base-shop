import { type FormEvent, memo, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Input, Textarea } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { withModalBackground } from "../../hoc/withModalBackground";
import { getUserDisplayName } from "../../lib/roles";
import { verifyManagerCredentials } from "../../services/managerReauth";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";

export interface ManagerAuthModalProps {
  title: string;
  description: ReactNode;
  notePlaceholder: string;
  noteRequiredError: string;
  selfConflictError: string;
  submitLabel: string;
  successToast: string;
  shiftOwnerName: string;
  shiftOwnerUid?: string;
  /** When provided, data-cy="<prefix>-email|password|<noteSuffix>|error|submit|cancel" are applied */
  testIdPrefix?: string;
  /** Suffix for the note textarea data-cy attribute (default: "note") */
  noteSuffix?: string;
  onConfirm: (managerName: string, managerUid: string, note: string) => void;
  onCancel: () => void;
}

function ManagerAuthModalBase({
  title,
  description,
  notePlaceholder,
  noteRequiredError,
  selfConflictError,
  submitLabel,
  successToast,
  shiftOwnerName,
  shiftOwnerUid,
  testIdPrefix,
  noteSuffix = "note",
  onConfirm,
  onCancel,
}: ManagerAuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const cy = (suffix: string) =>
    testIdPrefix ? { "data-cy": `${testIdPrefix}-${suffix}` } : {};
  const noteId = testIdPrefix ? { "data-cy": `${testIdPrefix}-${noteSuffix}` } : {};

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      if (isSubmitting) return;
      if (!email.trim() || !password.trim()) {
        setError("Email and password are required.");
        return;
      }
      if (!note.trim()) {
        setError(noteRequiredError);
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
        setError(selfConflictError);
        setIsSubmitting(false);
        return;
      }

      onConfirm(managerName, managerUid, note.trim());
      showToast(successToast, "success");
    },
    [
      email,
      password,
      note,
      isSubmitting,
      noteRequiredError,
      selfConflictError,
      successToast,
      shiftOwnerUid,
      shiftOwnerName,
      onConfirm,
    ]
  );

  return (
    <ModalContainer widthClasses="w-[26rem]">
      <h2 className="mb-2 text-center text-xl font-semibold">{title}</h2>
      <p className="mb-4 text-center text-sm text-foreground">{description}</p>
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
          {...cy("email")}
        />
        <Input
          compatibilityMode="no-wrapper"
          type="password"
          autoComplete="current-password"
          placeholder="Manager password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-center"
          {...cy("password")}
        />
        <Textarea
          compatibilityMode="no-wrapper"
          rows={3}
          placeholder={notePlaceholder}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-sm"
          {...noteId}
        />
        {error && (
          <div
            className="text-sm text-error-main"
            role="alert"
            {...cy("error")}
          >
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-center gap-2">
          <Button
            type="button"
            onClick={onCancel}
            className="min-h-11 min-w-11 rounded-lg bg-surface-3 px-4 py-2 text-foreground"
            {...cy("cancel")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 min-w-11 rounded-lg bg-primary-main px-4 py-2 text-primary-fg disabled:opacity-50"
            {...cy("submit")}
          >
            {isSubmitting ? "Verifying..." : submitLabel}
          </Button>
        </div>
      </form>
    </ModalContainer>
  );
}

ManagerAuthModalBase.displayName = "ManagerAuthModalBase";

export const ManagerAuthModal = withModalBackground(memo(ManagerAuthModalBase));
export default ManagerAuthModal;
