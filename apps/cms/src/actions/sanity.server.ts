// apps/cms/src/actions/sanity.server.ts
import { ensureAuthorized } from "./common/auth";

export interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
}

export async function connectSanity(form: FormData): Promise<{ ok: boolean; error?: string }> {
  await ensureAuthorized();
  const projectId = form.get("projectId");
  const dataset = form.get("dataset");
  const token = form.get("token");
  if (typeof projectId !== "string" || typeof dataset !== "string" || typeof token !== "string") {
    return { ok: false, error: "Missing credentials" };
  }
  return { ok: true };
}
