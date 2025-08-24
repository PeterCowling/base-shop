export interface RevokeSessionButtonProps {
    sessionId: string;
    revoke: (id: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
}
export default function RevokeSessionButton({ sessionId, revoke }: RevokeSessionButtonProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RevokeSessionButton.d.ts.map