"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { Alert } from "@/components/atoms";
import { useEffect, type ChangeEvent } from "react";
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
          data-cy="custom-domain"
          value={domain}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDomain(e.target.value)
          }
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
            className="text-link underline"
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
        <Alert variant="success" tone="soft" title="Deployment complete" />
      )}
      {deployInfo?.status === "error" && deployInfo.error && (
        <Alert variant="danger" tone="soft" title={deployInfo.error} />
      )}
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
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
