declare const preset: {
    readonly theme: {
        readonly extend: {
            readonly colors: {
                readonly bg: "hsl(var(--color-bg))";
                readonly fg: "hsl(var(--color-fg))";
                readonly primary: "hsl(var(--color-primary))";
                readonly accent: "hsl(var(--color-accent))";
                readonly danger: "hsl(var(--color-danger))";
                readonly success: "hsl(var(--color-success))";
                readonly warning: "hsl(var(--color-warning))";
                readonly info: "hsl(var(--color-info))";
                readonly muted: "hsl(var(--color-muted))";
            };
            readonly textColor: {
                readonly "primary-foreground": "hsl(var(--color-primary-fg))";
                readonly "accent-foreground": "hsl(var(--color-accent-fg))";
                readonly "danger-foreground": "hsl(var(--color-danger-fg))";
                readonly "success-foreground": "hsl(var(--color-success-fg))";
                readonly "warning-foreground": "hsl(var(--color-warning-fg))";
                readonly "info-foreground": "hsl(var(--color-info-fg))";
            };
            readonly fontFamily: {
                readonly sans: "var(--font-sans)";
                readonly mono: "var(--font-mono)";
            };
            readonly spacing: {
                readonly 1: "var(--space-1)";
                readonly 2: "var(--space-2)";
                readonly 3: "var(--space-3)";
                readonly 4: "var(--space-4)";
            };
            readonly borderRadius: {
                readonly sm: "var(--radius-sm)";
                readonly md: "var(--radius-md)";
                readonly lg: "var(--radius-lg)";
            };
            readonly boxShadow: {
                readonly sm: "var(--shadow-sm)";
                readonly md: "var(--shadow-md)";
                readonly lg: "var(--shadow-lg)";
            };
        };
    };
};
export default preset;
//# sourceMappingURL=index.d.ts.map