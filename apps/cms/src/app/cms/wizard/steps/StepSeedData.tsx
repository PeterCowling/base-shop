import { Button, Input } from "@/components/atoms-shadcn";

interface Props {
  csvFile: File | null;
  setCsvFile: (f: File | null) => void;
  categoriesText: string;
  setCategoriesText: (v: string) => void;
  seedResult: string | null;
  seeding: boolean;
  onBack: () => void;
  onNext: () => void;
  seed: () => void;
}

export default function StepSeedData({
  csvFile,
  setCsvFile,
  categoriesText,
  setCategoriesText,
  seedResult,
  seeding,
  onBack,
  onNext,
  seed,
}: Props): React.JSX.Element {
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
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={seeding} onClick={seed}>
          {seeding ? "Saving…" : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
