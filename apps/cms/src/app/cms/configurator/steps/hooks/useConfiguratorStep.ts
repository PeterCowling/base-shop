import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ZodTypeAny } from "zod";
import useStepCompletion from "../../hooks/useStepCompletion";

interface Options<T> {
  stepId: string;
  schema?: ZodTypeAny;
  values?: T;
  prevStepId?: string;
  nextStepId?: string;
}

export default function useConfiguratorStep<T>({
  stepId,
  schema,
  values,
  prevStepId,
  nextStepId,
}: Options<T>) {
  const router = useRouter();
  const [, markComplete] = useStepCompletion(stepId);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Avoid infinite re-validation loops when callers pass a new object literal
  // each render by hashing the values and only re-validating when the hash
  // changes meaningfully.
  const valuesKey = useMemo(() => {
    try {
      return JSON.stringify(values ?? null);
    } catch {
      return String(Math.random());
    }
  }, [values]);

  useEffect(() => {
    if (!schema || values === undefined) return;
    const parsed = schema.safeParse(values);
    if (parsed.success) {
      setErrors((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    } else {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
      setErrors((prev) => {
        // Shallow compare to avoid unnecessary state updates
        const sameKeys = Object.keys(prev).length === Object.keys(fieldErrors).length &&
          Object.keys(prev).every((k) => prev[k]?.[0] === fieldErrors[k]?.[0]);
        return sameKeys ? prev : fieldErrors;
      });
    }
  }, [schema, valuesKey, values]);

  const getError = (field: string) => errors[field]?.[0];
  const isValid = Object.keys(errors).length === 0;

  const goNext = () => {
    if (nextStepId) router.push(`/cms/configurator/${nextStepId}`);
  };
  const goPrev = () => {
    if (prevStepId) router.push(`/cms/configurator/${prevStepId}`);
  };

  return { router, markComplete, getError, isValid, goNext, goPrev, errors };
}
