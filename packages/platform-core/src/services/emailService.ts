import "server-only";

export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

let service: EmailService | undefined;

export function setEmailService(svc: EmailService): void {
  service = svc;
}

export function getEmailService(): EmailService {
  if (!service) {
    throw new Error("EmailService not registered");
  }
  return service;
}
