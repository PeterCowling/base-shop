"use client";

import { useState } from "react";
import { Button, Input } from "../../../atoms/shadcn";

interface Props {
  onCreate: (password?: string) => Promise<string> | Promise<void> | string | void;
}

const PreviewLinkForm = ({ onCreate }: Props) => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  const submit = async () => {
    setBusy(true);
    try {
      const res = await onCreate(password || undefined);
      if (typeof res === "string") setUrl(res);
    } finally {
      setBusy(false);
    }
  };

  const fullUrl = `${url}${password ? `?pw=${encodeURIComponent(password)}` : ""}`;

  return (
    <div className="col-span-1 space-y-2">
      <div className="text-sm font-medium">Shareable preview</div>
      <Input type="password" placeholder="Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={submit} disabled={busy}>
        {busy ? "Creating…" : "Create Link"}
      </Button>
      {url && (
        <div className="text-xs break-all">
          <div className="mb-1">URL: {fullUrl}</div>
          <Button
            variant="outline"
            onClick={() => navigator.clipboard?.writeText(fullUrl)}
          >
            Copy link
          </Button>
        </div>
      )}
    </div>
  );
};

export default PreviewLinkForm;

