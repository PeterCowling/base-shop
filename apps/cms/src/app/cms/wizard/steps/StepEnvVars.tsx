"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { envSchema, type Env } from "@acme/config";

const ENV_KEYS = Object.keys(envSchema.shape) as Array<keyof Env>;

interface Props {
  env: Partial<Env>;
  setEnv: (v: Partial<Env>) => void;
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
            onChange={(e) => setEnv({ ...env, [key]: e.target.value })}
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
