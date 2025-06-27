// src/lib/email.ts

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  console.log("Email to", to, "|", subject, "|", body);
}
