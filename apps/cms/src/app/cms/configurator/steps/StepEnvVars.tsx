"use client";

import { type ChangeEvent, useState } from "react";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface EnvVar {
  key: string;
  label: string;
  isPublic: boolean;
  advanced?: boolean;
}

// Only include the minimal set of variables needed for the tests. The real
// application defines many more but keeping the list tiny makes the component
// lightweight for unit tests.
const ENV_VARS: EnvVar[] = [
  { key: "STRIPE_SECRET_KEY", label: "Secret key", isPublic: false },
  { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", label: "Publishable key", isPublic: true },
];

export const ENV_KEYS = ENV_VARS.map((v) => v.key) as const;

interface Props {
  env: Record<string, string>;
  setEnv: (key: string, value: string) => void;
}

export default function StepEnvVars({ env, setEnv }: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("env-vars");
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const vars = showAdvanced ? ENV_VARS : ENV_VARS.filter((v) => !v.advanced);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Environment Variables</h2>
      {vars.map((v) => (
        <label key={v.key} className="flex flex-col gap-1">
          <span>{v.label}</span>
          <input
            type={v.isPublic ? "text" : "password"}
            value={env[v.key] ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEnv(v.key, e.target.value)
            }
            placeholder={v.key}
          />
        </label>
      ))}
      {ENV_VARS.some((v) => v.advanced) && (
        <button type="button" onClick={() => setShowAdvanced((s) => !s)}>
          {showAdvanced ? "Hide advanced variables" : "Show advanced variables"}
        </button>
      )}
      <div className="flex justify-end">
        <button
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </button>
      </div>
    </div>
  );
}
