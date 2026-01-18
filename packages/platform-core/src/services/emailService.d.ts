import "server-only";
export interface EmailService {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
}
export declare function setEmailService(svc: EmailService): void;
export declare function getEmailService(): EmailService;
/** Send an email using the system provider configuration. */
export declare function sendSystemEmail(data: {
    to: string;
    subject: string;
    html: string;
}): Promise<unknown>;
