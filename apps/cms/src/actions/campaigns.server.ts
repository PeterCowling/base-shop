// apps/cms/src/actions/campaigns.server.ts
"use server";

import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { getServerSession } from "next-auth";
import { sendCampaign } from "@acme/lib-email";

async function ensureAuthorized(): Promise<void> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session || role === "viewer") {
    throw new Error("Forbidden");
  }
}

export async function sendCampaignEmail(form: FormData): Promise<void> {
  await ensureAuthorized();
  const to = form.get("to")?.toString() ?? "";
  const subject = form.get("subject")?.toString() ?? "";
  const html = form.get("html")?.toString() ?? "";
  if (!to || !subject || !html) {
    throw new Error("Missing fields");
  }
  await sendCampaign({ to: to.split(/[,\s]+/), subject, html });
}
