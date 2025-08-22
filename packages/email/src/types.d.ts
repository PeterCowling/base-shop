export interface Campaign {
    id: string;
    recipients: string[];
    subject: string;
    body: string;
    segment?: string | null;
    sendAt: string;
    sentAt?: string;
    templateId?: string | null;
}
//# sourceMappingURL=types.d.ts.map