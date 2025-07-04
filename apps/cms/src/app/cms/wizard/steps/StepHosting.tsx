"use client";

import { Button, Input } from "@/components/atoms-shadcn";
import type { DeployShopResult } from "@platform-core/createShop";

interface Props {
  domain: string;
  setDomain: (v: string) => void;
  deployResult: string | null;
  deployInfo: DeployShopResult | { status: "pending" } | null;
  deploying: boolean;
  onBack: () => void;
  deploy: () => void;
}

export default function StepHosting({
  domain,
  setDomain,
  deployResult,
  deployInfo,
  deploying,
  onBack,
  deploy,
}: Props): React.JSX.Element {
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
