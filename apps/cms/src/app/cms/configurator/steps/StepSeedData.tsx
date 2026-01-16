"use client";

import { Button, Input } from "@acme/ui/components/atoms/shadcn";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  setCsvFile: (f: File | null) => void;
  categoriesText: string;
  setCategoriesText: (v: string) => void;
  seedResult: string | null;
  seeding: boolean;
  seed: () => Promise<void> | void;
}

export default function StepSeedData({
  setCsvFile,
  categoriesText,
  setCategoriesText,
  seedResult,
  seeding,
  seed,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("seed-data");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Seed Data</h2>
      <label className="flex flex-col gap-1">
        <span>Product CSV</span>
        <Input
          data-cy="product-csv"
          type="file"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCsvFile(e.target.files?.[0] ?? null)
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span>Categories (comma or newline separated)</span>
        <Input
          data-cy="categories"
          value={categoriesText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCategoriesText(e.target.value)
          }
          placeholder="Shoes, Shirts, Accessories"
        />
      </label>
      {seedResult && <p className="text-sm">{seedResult}</p>}
      <div className="flex justify-end gap-2">
        <Button
          data-cy="save-return"
          disabled={seeding}
          onClick={async () => {
            await seed();
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          {seeding ? "Saving…" : "Save & return"}
        </Button>
      </div>
    </div>
  );
}
