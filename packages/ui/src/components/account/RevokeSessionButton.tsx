"use client";

// packages/ui/src/components/account/RevokeSessionButton.tsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useTranslations } from "@acme/i18n";

export interface RevokeSessionButtonProps {
  sessionId: string;
  revoke: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function RevokeSessionButton({
  sessionId,
  revoke,
}: RevokeSessionButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await revoke(sessionId);
      if (result.success) {
        router.refresh();
      } else {
        setError(
          (result.error ? (t(result.error) as string) : t("account.sessions.errors.revokeFailed"))
        );
      }
    });
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded bg-primary px-4 py-2 min-h-11 min-w-11"
        data-token="--color-primary" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — label below is translated
      >
        <span className="text-primary-fg" data-token="--color-primary-fg"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] — child content uses t() */}
          {isPending ? t("actions.revoking") : t("actions.revoke")}
        </span>
      </button>
      {error && (
        <p className="mt-2 text-sm text-danger" data-token="--color-danger"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] — dynamic error message */}
          {error}
        </p>
      )}
    </div>
  );
}
