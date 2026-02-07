import "server-only";

import { createRequire } from "module";

const req: NodeRequire =
  typeof require === "function" ? require : createRequire(process.cwd() + "/");

export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

let service: EmailService | undefined;

export function setEmailService(svc: EmailService): void {
  service = svc;
}

export function getEmailService(): EmailService {
  if (!service) {
    throw new Error("EmailService not registered"); // i18n-exempt -- CORE-1011 internal error message
  }
  return service;
}

/** Send an email using the system provider configuration. */
export async function sendSystemEmail(data: {
  to: string;
  subject: string;
  html: string;
}): Promise<unknown> {
  if (!process.env.EMAIL_PROVIDER) {
    throw new Error("Email provider not configured"); // i18n-exempt -- CORE-1011 internal error message
  }
  type EmailModule = {
    sendEmail(to: string, subject: string, html: string): Promise<unknown>;
  };
  // Dynamic require hidden from webpack static analysis to avoid cyclic dependency
  const pkg = ["@acme", "email"].join("/");
  const mod = req(pkg) as EmailModule;
  return mod.sendEmail(data.to, data.subject, data.html);
}
