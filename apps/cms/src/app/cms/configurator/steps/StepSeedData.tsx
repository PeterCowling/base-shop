"use client";

import { Input } from "@/components/atoms/shadcn";
import useStepCompletion from "../hooks/useStepCompletion";
import { StepControls } from "../steps";

interface Props {
  setCsvFile: (f: File | null) => void;
  categoriesText: string;
  setCategoriesText: (v: string) => void;
  seedResult: string | null;
  seeding: boolean;
  seed: () => Promise<void> | void;
  previousStepId?: string;
  nextStepId?: string;
}

export default function StepSeedData({
  setCsvFile,
  categoriesText,
  setCategoriesText,
  seedResult,
  seeding,
  seed,
  previousStepId,
  nextStepId,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("seed-data");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Seed Data</h2>
      <label className="flex flex-col gap-1">
        <span>Product CSV</span>
        <Input
          type="file"
          onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Categories (comma or newline separated)</span>
        <Input
          value={categoriesText}
          onChange={(e) => setCategoriesText(e.target.value)}
          placeholder="Shoes, Shirts, Accessories"
        />
      </label>
      {seedResult && <p className="text-sm">{seedResult}</p>}
      <StepControls
        prev={previousStepId}
        next={nextStepId}
        onNext={async () => {
          await seed();
          markComplete(true);
        }}
        nextDisabled={seeding}
      />
    </div>
  );
}
