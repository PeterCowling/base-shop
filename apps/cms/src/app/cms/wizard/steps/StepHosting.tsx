"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import type { DeployStatusBase } from "@platform-core/createShop";
import { useEffect } from "react";
import { getDeployStatus, type DeployInfo } from "../services/deployShop";
import useStepCompletion from "../hooks/useStepCompletion";

interface Props {
  shopId: string;
  domain: string;
  setDomain: (v: string) => void;
  deployResult: string | null;
  deployInfo: (DeployStatusBase & { domainStatus?: string }) | null;
  setDeployInfo: (
    info: (DeployStatusBase & { domainStatus?: string }) | null
  ) => void;
  deploying: boolean;
  onBack: () => void;
  deploy: () => Promise<void> | void;
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
  const [, markComplete] = useStepCompletion("hosting");
  useEffect(() => {
    if (!shopId || !deployInfo) return;
    if (
      deployInfo.status !== "pending" &&
      deployInfo.domainStatus !== "pending"
    ) {
      return;
    }
    let timer: NodeJS.Timeout;
    const poll = async () => {
      try {
        const status = await getDeployStatus(shopId);
        setDeployInfo(status as DeployInfo);
        if (
          status.status === "pending" ||
          (status as DeployInfo).domainStatus === "pending"
        ) {
          timer = setTimeout(poll, 5000);
        }
      } catch {
        timer = setTimeout(poll, 5000);
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [shopId, deployInfo, setDeployInfo]);

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
        <p className="text-sm">Waiting for domain verification…</p>
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
        <Button
          disabled={deploying}
          onClick={async () => {
            await deploy();
            markComplete(true);
          }}
        >
          {deploying ? "Deploying…" : "Deploy"}
        </Button>
      </div>
    </div>
  );
}
