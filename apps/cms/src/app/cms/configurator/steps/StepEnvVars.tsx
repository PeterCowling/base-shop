"use client";

import { type ChangeEvent,useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Input,
} from "@/components/atoms/shadcn";

import useStepCompletion from "../hooks/useStepCompletion";

interface EnvVar {
  key: string;
  category: string;
  label: string;
  description: string;
  isPublic: boolean;
  advanced?: boolean;
}

const ENV_VARS: EnvVar[] = [
  // Stripe -----------------------------------------------------------
  {
    key: "STRIPE_SECRET_KEY",
    category: "Stripe",
    label: "Secret key",
    description: "Server-side key for Stripe API access",
    isPublic: false,
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    category: "Stripe",
    label: "Publishable key",
    description: "Public key for Stripe payments",
    isPublic: true,
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    category: "Stripe",
    label: "Webhook secret",
    description: "Validates Stripe webhook signatures",
    isPublic: false,
    advanced: true,
  },

  // Authentication --------------------------------------------------
  {
    key: "NEXTAUTH_SECRET",
    category: "Authentication",
    label: "NextAuth secret",
    description: "Secret used by NextAuth for signing",
    isPublic: false,
  },
  {
    key: "PREVIEW_TOKEN_SECRET",
    category: "Authentication",
    label: "Preview token secret",
    description: "Secret for preview token generation",
    isPublic: false,
    advanced: true,
  },

  // Runtime ---------------------------------------------------------
  {
    key: "NODE_ENV",
    category: "Runtime",
    label: "Node environment",
    description: "development or production",
    isPublic: false,
    advanced: true,
  },
  {
    key: "OUTPUT_EXPORT",
    category: "Runtime",
    label: "Output export",
    description: "Set to enable Next.js static export",
    isPublic: false,
    advanced: true,
  },
  {
    key: "NEXT_PUBLIC_PHASE",
    category: "Runtime",
    label: "Next.js phase",
    description: "Custom phase identifier",
    isPublic: true,
    advanced: true,
  },
  {
    key: "NEXT_PUBLIC_DEFAULT_SHOP",
    category: "Runtime",
    label: "Default shop",
    description: "Slug of default shop to load",
    isPublic: true,
    advanced: true,
  },
  {
    key: "NEXT_PUBLIC_SHOP_ID",
    category: "Runtime",
    label: "Shop ID",
    description: "Identifier for the shop instance",
    isPublic: true,
    advanced: true,
  },
  {
    key: "CART_TTL",
    category: "Runtime",
    label: "Cart TTL",
    description: "Cart time-to-live in seconds",
    isPublic: false,
    advanced: true,
  },

  // CMS -------------------------------------------------------------
  {
    key: "CMS_SPACE_URL",
    category: "CMS",
    label: "CMS space URL",
    description: "Base URL for the CMS space",
    isPublic: false,
  },
  {
    key: "CMS_ACCESS_TOKEN",
    category: "CMS",
    label: "CMS access token",
    description: "Token used to access CMS APIs",
    isPublic: false,
  },
  {
    key: "SANITY_PROJECT_ID",
    category: "CMS",
    label: "Sanity project ID",
    description: "Sanity project identifier",
    isPublic: false,
  },
  {
    key: "SANITY_DATASET",
    category: "CMS",
    label: "Sanity dataset",
    description: "Sanity dataset name",
    isPublic: false,
  },
  {
    key: "SANITY_TOKEN",
    category: "CMS",
    label: "Sanity token",
    description: "Token for Sanity API access",
    isPublic: false,
  },

  // Integrations ----------------------------------------------------
  {
    key: "CHROMATIC_PROJECT_TOKEN",
    category: "Integrations",
    label: "Chromatic token",
    description: "Token for Chromatic visual testing",
    isPublic: false,
    advanced: true,
  },
  {
    key: "GMAIL_USER",
    category: "Integrations",
    label: "Gmail user",
    description: "Username for Gmail SMTP",
    isPublic: false,
  },
  {
    key: "GMAIL_PASS",
    category: "Integrations",
    label: "Gmail password",
    description: "Password or app password for Gmail SMTP",
    isPublic: false,
    advanced: true,
  },
];

const ENV_KEYS = [...ENV_VARS.map((v) => v.key)] as const;

interface Props {
  env: Record<string, string>;
  setEnv: (key: string, value: string) => void;
}

export default function StepEnvVars({
  env,
  setEnv,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("env-vars");
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const grouped = ENV_VARS.reduce<Record<string, EnvVar[]>>((acc, v) => {
    if (!showAdvanced && v.advanced) return acc;
    (acc[v.category] ??= []).push(v);
    return acc;
  }, {});

  const hasAdvanced = ENV_VARS.some((v) => v.advanced);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Environment Variables</h2>
      <p className="text-sm text-muted-foreground">
        Provide credentials for any services your shop will use. Fields left
        empty will be written as placeholders so you can update them later.
        Some providers also require a plugin under <code>packages/plugins</code>
        – see the setup docs for details.
      </p>
      {Object.entries(grouped).map(([category, vars]) => (
        <section key={category} className="flex flex-col gap-3">
          <h3 className="font-medium">{category}</h3>
          {vars.map((v) => (
            <label key={v.key} className="flex flex-col gap-1">
              <span className="flex items-center gap-1">
                {v.label}
                <span title={v.description}>?</span>
              </span>
              <Input
                data-cy={`env-${v.key}`}
                type={v.isPublic ? "text" : "password"}
                value={env[v.key] ?? ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEnv(v.key, e.target.value)}
                placeholder={v.key}
              />
              <span className="text-xs text-muted-foreground">
                {v.description}
              </span>
            </label>
          ))}
        </section>
      ))}
      {hasAdvanced && (
        <Button
          type="button"
          variant="ghost"
          data-cy="toggle-advanced-vars"
          onClick={() => setShowAdvanced((s) => !s)}
        >
          {showAdvanced ? "Hide advanced variables" : "Show advanced variables"}
        </Button>
      )}
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
      </div>
    </div>
  );
}

export { ENV_KEYS };
