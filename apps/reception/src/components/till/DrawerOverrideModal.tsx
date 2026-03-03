import { type FormEvent, memo, useCallback, useEffect, useRef, useState } from "react";

import { Input, Textarea } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { withModalBackground } from "../../hoc/withModalBackground";
import { getUserDisplayName } from "../../lib/roles";
import { verifyManagerCredentials } from "../../services/managerReauth";
import type { DrawerOverride } from "../../types/component/Till";
import { getItalyIsoString } from "../../utils/dateUtils";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";

interface DrawerOverrideModalProps {
  shiftOwnerName: string;
  shiftOwnerUid?: string;
  onConfirm: (override: DrawerOverride) => void;
  onCancel: () => void;
}

function DrawerOverrideModalBase({
  shiftOwnerName,
  shiftOwnerUid,
  onConfirm,
  onCancel,
}: DrawerOverrideModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
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
      if (!reason.trim()) {
        setError("Override reason is required.");
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
        setError("You cannot override your own shift.");
        setIsSubmitting(false);
        return;
      }

      onConfirm({
        overriddenBy: managerName,
        overriddenByUid: managerUid,
        overriddenAt: getItalyIsoString(),
        overrideReason: reason.trim(),
      });

      showToast("Manager override recorded.", "success");
    },
    [
      email,
      password,
      reason,
      isSubmitting,
      shiftOwnerUid,
      shiftOwnerName,
      onConfirm,
    ]
  );

  return (
    <ModalContainer widthClasses="w-[26rem]">
      <h2 className="mb-2 text-center text-xl font-semibold">
        Manager Override Required
      </h2>
      <p className="mb-4 text-center text-sm text-foreground">
        This shift was opened by{" "}
        <span className="font-semibold">{shiftOwnerName}</span>. A manager must
        authenticate to close it on their behalf.
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
          data-cy="drawer-override-email"
        />
        <Input
          compatibilityMode="no-wrapper"
          type="password"
          autoComplete="current-password"
          placeholder="Manager password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-center"
          data-cy="drawer-override-password"
        />
        <Textarea
          compatibilityMode="no-wrapper"
          rows={3}
          placeholder="Override reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-border-2 px-4 py-2 text-sm"
          data-cy="drawer-override-reason"
        />
        {error && (
          <div
            className="text-sm text-error-main"
            role="alert"
            data-cy="drawer-override-error"
          >
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-center gap-2">
          <Button
            type="button"
            onClick={onCancel}
            className="min-h-11 min-w-11 rounded-lg bg-surface-3 px-4 py-2 text-foreground"
            data-cy="drawer-override-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 min-w-11 rounded-lg bg-primary-main px-4 py-2 text-primary-fg disabled:opacity-50"
            data-cy="drawer-override-submit"
          >
            {isSubmitting ? "Verifying..." : "Override"}
          </Button>
        </div>
      </form>
    </ModalContainer>
  );
}

DrawerOverrideModalBase.displayName = "DrawerOverrideModalBase";

export default withModalBackground(memo(DrawerOverrideModalBase));
