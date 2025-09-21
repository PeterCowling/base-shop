"use client";

import { useState } from "react";
import { Button, Input } from "../../../atoms/shadcn";

interface Props {
  onCreate: (label: string | undefined, splitA: number) => Promise<void> | void;
}

const ExperimentForm = ({ onCreate }: Props) => {
  const [label, setLabel] = useState("");
  const [splitA, setSplitA] = useState<number>(50);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onCreate(label || undefined, splitA);
      setLabel("");
      setSplitA(50);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="col-span-1 space-y-2">
      <div className="text-sm font-medium">Create experiment</div>
      <Input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <Input type="number" min={0} max={100} value={splitA} onChange={(e) => setSplitA(Number(e.target.value))} />
      <Button onClick={submit} disabled={busy}>
        {busy ? "Creating…" : "Create Experiment"}
      </Button>
    </div>
  );
};

export default ExperimentForm;

