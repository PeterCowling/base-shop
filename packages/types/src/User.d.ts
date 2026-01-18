export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    resetToken: string | null;
    resetTokenExpiresAt: Date | null;
    emailVerified: boolean;
    stripeSubscriptionId?: string | null;
}
//# sourceMappingURL=User.d.ts.map