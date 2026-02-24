"use client";


import * as React from "react";

import { Button, Input, Textarea } from "@acme/design-system/atoms";

import { xaI18n } from "../../lib/xaI18n";

import { gateClassNames } from "./gateClasses";

type RequestState = "idle" | "loading" | "success" | "error";

type AccessGateProps = {
  monoClassName?: string;
};

function sanitizeInput(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export default function AccessGateClient({ monoClassName }: AccessGateProps) {
  const [handle, setHandle] = React.useState("");
  const [referredBy, setReferredBy] = React.useState("");
  const [note, setNote] = React.useState("");
  const [state, setState] = React.useState<RequestState>("idle");
  const [receipt, setReceipt] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const displayReferredBy = sanitizeInput(referredBy, 120);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setState("loading");

    try {
      const payload = {
        handle: sanitizeInput(handle, 80),
        referredBy: displayReferredBy,
        note: sanitizeInput(note, 280),
      };
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = xaI18n.t("xaB.src.app.access.accessgate.client.l46c23");
        try {
          const data = (await response.json()) as { error?: string };
          if (data?.error === "rate_limited") {
            message = "Too many requests. Try again later.";
          }
        } catch {
          // ignore JSON errors
        }
        throw new Error(message);
      }
      const data = (await response.json()) as { id?: string };
      const rawId = data.id ?? crypto.randomUUID();
      const id = rawId.split("-")[0]?.toUpperCase() ?? "REQ";
      setReceipt(`RQ-${id}`);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : xaI18n.t("xaB.src.app.access.accessgate.client.l63c53"));
      setState("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className={`text-xs uppercase xa-tracking-035 ${monoClassName ?? ""}`}>{xaI18n.t("xaB.src.app.access.accessgate.client.l72c87")}</div>
          <div className={`mt-2 text-sm ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.accessgate.client.l75c71")}</div>
        </div>
        <div className={gateClassNames.chip}>{xaI18n.t("xaB.src.app.access.accessgate.client.l79c46")}</div>
      </div>

      <form onSubmit={submitRequest} className="space-y-4">
        <label className={gateClassNames.fieldLabel}>
          Alias
          <Input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder={xaI18n.t("xaB.src.app.access.accessgate.client.l90c25")}
            className={gateClassNames.fieldInput}
            autoComplete="off"
          />
        </label>
        <label className={gateClassNames.fieldLabel}>
          Sent by
          <Input
            value={referredBy}
            onChange={(event) => setReferredBy(event.target.value)}
            placeholder={xaI18n.t("xaB.src.app.access.accessgate.client.l100c25")}
            className={gateClassNames.fieldInput}
            autoComplete="off"
          />
        </label>
        <label className={gateClassNames.fieldLabel}>
          Why you
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={xaI18n.t("xaB.src.app.access.accessgate.client.l110c25")}
            rows={4}
            className={gateClassNames.fieldInput}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={state === "loading"}
            className={gateClassNames.primaryButton}
          >
            {state === "loading" ? "Transmitting..." : xaI18n.t("xaB.src.app.access.accessgate.client.l122c56")}
          </Button>
          <div className={`text-xs ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.accessgate.client.l124c66")}</div>
        </div>

        {state === "success" ? (
          <div className="rounded-md border border-border-2 bg-muted p-3 text-sm">
            <div className={gateClassNames.inkText}>{xaI18n.t("xaB.src.app.access.accessgate.client.l131c53")}{" "}
              <span className={monoClassName}>{receipt}</span>
            </div>
            {displayReferredBy ? (
              <div className={`mt-1 ${gateClassNames.mutedText}`}>
                Sent by: <span className={monoClassName}>{displayReferredBy}</span>
              </div>
            ) : null}
            <div className={`mt-1 ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.accessgate.client.l140c65")}</div>
          </div>
        ) : null}
        {state === "error" ? (
          <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger-fg">
            {error ?? "Request failed. Try again."}
          </div>
        ) : null}
      </form>
    </div>
  );
}
