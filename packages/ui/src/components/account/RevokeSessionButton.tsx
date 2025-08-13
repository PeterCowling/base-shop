"use client";

// packages/ui/src/components/account/RevokeSessionButton.tsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revoke } from "./Sessions";

export interface RevokeSessionButtonProps {
  sessionId: string;
}

export default function RevokeSessionButton({ sessionId }: RevokeSessionButtonProps) {
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
        setError(result.error ?? "Failed to revoke session.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded bg-primary px-4 py-2"
        data-token="--color-primary"
      >
        <span className="text-primary-fg" data-token="--color-primary-fg">
          {isPending ? "Revoking..." : "Revoke"}
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
