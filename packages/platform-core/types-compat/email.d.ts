declare module "@acme/email" {
  export function sendEmail(to: string, subject: string, body: string): Promise<void>;
}
