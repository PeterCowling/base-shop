"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { Alert } from "@acme/ui/components/atoms";
import { useEffect, type ChangeEvent } from "react";
import { getDeployStatus, type DeployInfo } from "../../wizard/services/deployShop";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useTranslations } from "@acme/i18n";

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
  // i18n-exempt -- ABC-123 [ttl=2099-12-31] data-cy tokens for testing only
  const CY_CUSTOM_DOMAIN = "custom-domain";
  const [, markComplete] = useStepCompletion("hosting");
  const router = useRouter();
  const t = useTranslations();
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
      <h2 className="text-xl font-semibold">{t("cms.configurator.hosting.title")}</h2>
      <label className="flex flex-col gap-1">
        <span>{t("cms.configurator.hosting.customDomain")}</span>
        <Input
          data-cy={CY_CUSTOM_DOMAIN}
          value={domain}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDomain(e.target.value)
          }
          placeholder={String(t("cms.configurator.hosting.domainPlaceholder"))}
        />
      </label>
      {deployResult && (
        // i18n-exempt -- ABC-123 [ttl=2099-12-31]
        <p className="text-sm">{deployResult}</p>
      )}
      {deployInfo?.previewUrl && (
        <p className="text-sm">
          {t("cms.configurator.hosting.previewPrefix")} {" "}
          <a
            href={deployInfo.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-link underline inline-flex items-center min-h-11 min-w-11 px-2"
          >
            {/* i18n-exempt -- ABC-123 [ttl=2099-12-31] */}
            {deployInfo.previewUrl}
          </a>
        </p>
      )}
      {deployInfo?.instructions && (
        // i18n-exempt -- ABC-123 [ttl=2099-12-31]
        <p className="text-sm">{deployInfo.instructions}</p>
      )}
      {deployInfo?.domainStatus === "pending" && (
        <p className="text-sm">{t("cms.configurator.hosting.waitingVerification")}</p>
      )}
      {deployInfo?.status === "success" && (
        <Alert
          variant="success"
          tone="soft"
          heading={String(t("cms.configurator.hosting.deploymentComplete"))}
        />
      )}
      {deployInfo?.status === "error" && deployInfo.error && (
        // i18n-exempt -- ABC-123 [ttl=2099-12-31]
        <Alert variant="danger" tone="soft" heading={deployInfo.error} />
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
          {deploying ? t("cms.configurator.hosting.deploying") : t("cms.configurator.saveReturn")}
        </Button>
      </div>
    </div>
  );
}
