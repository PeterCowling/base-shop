"use client";

import { Button, Input, Textarea } from "@/components/atoms/shadcn";

interface Props {
  setCsvFile: (f: File | null) => void;
  categoriesText: string;
  setCategoriesText: (v: string) => void;
  importResult: string | null;
  importing: boolean;
  onBack: () => void;
  saveData: () => void;
}

export default function StepImportData({
  setCsvFile,
  categoriesText,
  setCategoriesText,
  importResult,
  importing,
  onBack,
  saveData,
}: Props): React.JSX.Element {
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
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={importing} onClick={saveData}>
          {importing ? "Saving…" : "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
