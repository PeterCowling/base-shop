"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { ActionFeedback } from "../../components/catalog/catalogConsoleFeedback";
import { CatalogLoginForm } from "../../components/catalog/CatalogLoginForm.client";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

function buildFeedback(kind: ActionFeedback["kind"], message: string): ActionFeedback {
  return { kind, message };
}

export function UploaderLoginClient() {
  const { t } = useUploaderI18n();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/uploader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        throw new Error(t("unauthorized"));
      }
      window.location.assign("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loginFailed");
      setFeedback(buildFeedback("error", message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CatalogLoginForm
      token={token}
      busy={busy}
      feedback={feedback}
      onTokenChange={setToken}
      onSubmit={handleSubmit}
    />
  );
}
