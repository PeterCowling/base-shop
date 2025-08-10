"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import type { DeployStatusBase } from "@platform-core/createShop";
import { useEffect } from "react";

interface Props {
  shopId: string;
  domain: string;
  setDomain: (v: string) => void;
  deployResult: string | null;
  deployInfo: DeployStatusBase | null;
  setDeployInfo: (info: DeployStatusBase) => void;
  deploying: boolean;
  onBack: () => void;
  deploy: () => void;
}

export default function StepHosting({
  shopId,
  domain,
  setDomain,
  deployResult,
  deployInfo,
  setDeployInfo,
  deploying,
  onBack,
  deploy,
}: Props): React.JSX.Element {
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const poll = async () => {
      try {
        const res = await fetch(`/cms/api/deploy-shop?id=${shopId}`);
        if (!res.ok) return;
        const status = (await res.json()) as DeployStatusBase;
        setDeployInfo(status);
        if (status.domainStatus === "pending") {
          timer = setTimeout(poll, 5000);
        }
      } catch {
        // ignore network errors
      }
    };

    if (!deployInfo || deployInfo.domainStatus === "pending") {
      poll();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [shopId, deployInfo?.domainStatus, setDeployInfo]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Hosting</h2>
      <label className="flex flex-col gap-1">
        <span>Custom Domain</span>
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="myshop.example.com"
        />
      </label>
      {deployResult && <p className="text-sm">{deployResult}</p>}
      {deployInfo?.previewUrl && (
        <p className="text-sm">
          Preview:{" "}
          <a
            href={deployInfo.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {deployInfo.previewUrl}
          </a>
        </p>
      )}
      {deployInfo?.instructions && (
        <p className="text-sm">{deployInfo.instructions}</p>
      )}
      {deployInfo?.domainStatus === "pending" && (
        <p className="text-sm">Verifying domain ownership…</p>
      )}
      {deployInfo?.domainStatus === "active" && (
        <p className="text-sm text-green-600">Domain verified</p>
      )}
      {deployInfo?.domainStatus === "error" && (
        <p className="text-sm text-red-600">Domain provisioning failed</p>
      )}
      {deployInfo?.status === "success" && (
        <p className="text-sm text-green-600">Deployment complete</p>
      )}
      {deployInfo?.status === "error" && deployInfo.error && (
        <p className="text-sm text-red-600">{deployInfo.error}</p>
      )}
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={deploying} onClick={deploy}>
          {deploying ? "Deploying…" : "Deploy"}
        </Button>
      </div>
    </div>
  );
}
