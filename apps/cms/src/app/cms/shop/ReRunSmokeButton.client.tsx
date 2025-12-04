"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/shadcn";

interface Props {
  shopId: string;
  env?: "dev" | "stage" | "prod";
}

export default function ReRunSmokeButton({
  shopId,
  env = "stage",
}: Props): React.JSX.Element {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/cms/api/smoke-tests/${encodeURIComponent(shopId)}?env=${encodeURIComponent(env)}`,
          { method: "POST" },
        );
        const json = (await res.json().catch(() => ({}))) as {
          status?: string;
          error?: string;
        };
        if (!res.ok) {
          setStatus("Error");
          return;
        }
        if (json.status === "passed") {
          setStatus("Passed");
        } else if (json.status === "failed") {
          setStatus("Failed");
        } else {
          setStatus("Not run");
        }
      } catch {
        setStatus("Error");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? "Re-running smoke tests..." : "Re-run smoke tests"}
      </Button>
      {status && (
        <span className="text-xs text-muted-foreground">
          {status}
        </span>
      )}
    </div>
  );
}

