"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import {
  type DeployStatusBase,
  type DeployShopResult,
} from "@platform-core/createShop";
import { useEffect, useState } from "react";
import { getDeployStatus } from "../services/deployShop";

interface Props {
  shopId: string;
  domain: string;
  setDomain: (v: string) => void;
  deployResult: string | null;
  deployInfo: DeployStatusBase | null;
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
  deploying,
  onBack,
  deploy,
}: Props): React.JSX.Element {
  const [info, setInfo] = useState<DeployStatusBase | null>(deployInfo);

  useEffect(() => {
    setInfo(deployInfo);
  }, [deployInfo]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const poll = async () => {
      const res = await getDeployStatus(shopId);
      setInfo(res as DeployShopResult);
      const d = res as DeployShopResult;
      if (
        d.status === "pending" ||
        (d.domain && d.domain.status === "pending")
      ) {
        timer = setTimeout(poll, 3000);
      }
    };
    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [shopId]);

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
      {info?.previewUrl && (
        <p className="text-sm">
          Preview:{" "}
          <a
            href={info.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {info.previewUrl}
          </a>
        </p>
      )}
      {info?.instructions && <p className="text-sm">{info.instructions}</p>}
      {info && "domain" in info && (info as DeployShopResult).domain && (
        <p className="text-sm">
          Domain {(info as DeployShopResult).domain?.name}: {(info as DeployShopResult).domain?.status}
        </p>
      )}
      {info?.status === "success" && (
        <p className="text-sm text-green-600">Deployment complete</p>
      )}
      {info?.status === "error" && info.error && (
        <p className="text-sm text-red-600">{info.error}</p>
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
