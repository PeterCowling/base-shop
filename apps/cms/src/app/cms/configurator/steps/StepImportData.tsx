"use client";

import { Input, Textarea } from "@/components/atoms/shadcn";
import useStepCompletion from "../hooks/useStepCompletion";
import { StepControls } from "../steps";

interface Props {
  setCsvFile: (f: File | null) => void;
  categoriesText: string;
  setCategoriesText: (v: string) => void;
  importResult: string | null;
  importing: boolean;
  saveData: () => Promise<void> | void;
  previousStepId?: string;
  nextStepId?: string;
}

export default function StepImportData({
  setCsvFile,
  categoriesText,
  setCategoriesText,
  importResult,
  importing,
  saveData,
  previousStepId,
  nextStepId,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("import-data");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Import Data</h2>
      <label className="flex flex-col gap-1">
        <span>Products CSV</span>
        <Input
          type="file"
          accept=".csv"
          onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <Textarea
        label="Categories JSON"
        value={categoriesText}
        onChange={(e) => setCategoriesText(e.target.value)}
        placeholder='["Shoes","Accessories"]'
      />
      {importResult && <p className="text-sm">{importResult}</p>}
      <StepControls
        prev={previousStepId}
        next={nextStepId}
        onNext={async () => {
          await saveData();
          markComplete(true);
        }}
        nextDisabled={importing}
      />
    </div>
  );
}
