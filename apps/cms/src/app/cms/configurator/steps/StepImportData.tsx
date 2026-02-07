"use client";

import { useRouter } from "next/navigation";

import { Button, Input, Textarea } from "@/components/atoms/shadcn";

import useStepCompletion from "../hooks/useStepCompletion";

interface Props {
  setCsvFile: (f: File | null) => void;
  categoriesText: string;
  setCategoriesText: (v: string) => void;
  importResult: string | null;
  importing: boolean;
  saveData: () => Promise<void> | void;
}

export default function StepImportData({
  setCsvFile,
  categoriesText,
  setCategoriesText,
  importResult,
  importing,
  saveData,
}: Props): React.JSX.Element {
  const [, markComplete] = useStepCompletion("import-data");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Import Data</h2>
      <label className="flex flex-col gap-1">
        <span>Products CSV</span>
        <Input
          data-cy="products-csv"
          type="file"
          accept=".csv"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCsvFile(e.target.files?.[0] ?? null)
          }
        />
      </label>
      <Textarea
        data-cy="categories-json"
        label="Categories JSON"
        value={categoriesText}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setCategoriesText(e.target.value)
        }
        placeholder='["Shoes","Accessories"]'
      />
      {importResult && <p className="text-sm">{importResult}</p>}
      <div className="flex justify-end gap-2">
        <Button
          data-cy="save-return"
          disabled={importing}
          onClick={async () => {
            await saveData();
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          {importing ? "Saving…" : "Save & return"}
        </Button>
      </div>
    </div>
  );
}
