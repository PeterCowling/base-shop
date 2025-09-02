import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (schema && values) {
      const parsed = schema.safeParse(values);
      if (parsed.success) {
        setErrors({});
      } else {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        setErrors(fieldErrors as Record<string, string[]>);
      }
    }
  }, [schema, values]);

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
