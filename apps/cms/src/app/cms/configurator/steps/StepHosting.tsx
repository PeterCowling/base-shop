"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { useEffect } from "react";
import { getDeployStatus, type DeployInfo } from "../../wizard/services/deployShop";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  shopId: string;
  domain: string;
  setDomain: (v: string) => void;
  deployResult: string | null;
  deployInfo: DeployInfo | null;
  setDeployInfo: (info: DeployInfo | null) => void;
  deploying: boolean;
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
  deploy,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("hosting");
  const router = useRouter();
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
        setDeployInfo(status);
        if (
          status.status === "pending" ||
          status.domainStatus === "pending"
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
      <div className="flex justify-end">
        <Button
          disabled={deploying}
          onClick={async () => {
            await deploy();
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          {deploying ? "Deploying…" : "Save & return"}
        </Button>
      </div>
    </div>
  );
}
