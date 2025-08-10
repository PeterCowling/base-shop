"use client";

import {
  Button,
  Input,
} from "@/components/atoms/shadcn";

const ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXTAUTH_SECRET",
  "PREVIEW_TOKEN_SECRET",
  "NODE_ENV",
  "OUTPUT_EXPORT",
  "NEXT_PUBLIC_PHASE",
  "NEXT_PUBLIC_DEFAULT_SHOP",
  "NEXT_PUBLIC_SHOP_ID",
  "CMS_SPACE_URL",
  "CMS_ACCESS_TOKEN",
  "CHROMATIC_PROJECT_TOKEN",
  "GMAIL_USER",
  "GMAIL_PASS",
  "SANITY_PROJECT_ID",
  "SANITY_DATASET",
  "SANITY_WRITE_TOKEN",
] as const;

interface Props {
  env: Record<string, string>;
  setEnv: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepEnvVars({
  env,
  setEnv,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Environment Variables</h2>
      {ENV_KEYS.map((key) => (
        <label key={key} className="flex flex-col gap-1">
          <span>{key}</span>
          <Input
            type={key.startsWith("NEXT_PUBLIC") ? "text" : "password"}
            value={env[key] ?? ""}
            onChange={(e) => setEnv(key, e.target.value)}
            placeholder={key}
          />
        </label>
      ))}
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}

export { ENV_KEYS };
