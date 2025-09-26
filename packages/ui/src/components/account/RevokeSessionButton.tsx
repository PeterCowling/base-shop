"use client";

// packages/ui/src/components/account/RevokeSessionButton.tsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
const t = (s: string) => s;

export interface RevokeSessionButtonProps {
  sessionId: string;
  revoke: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function RevokeSessionButton({
  sessionId,
  revoke,
}: RevokeSessionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await revoke(sessionId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? t("Failed to revoke session."));
      }
    });
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded bg-primary px-4 py-2 min-h-10 min-w-10"
        data-token="--color-primary"
      >
        <span className="text-primary-fg" data-token="--color-primary-fg">
          {isPending ? t("Revoking...") : t("Revoke")}
        </span>
      </button>
      {error && (
        <p className="mt-2 text-sm text-danger" data-token="--color-danger">
          {error}
        </p>
      )}
    </div>
  );
}
