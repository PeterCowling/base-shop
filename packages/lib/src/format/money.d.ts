export declare function normalizeCurrencyCode(currency: string): string;
export declare function getCurrencyFractionDigits(currency: string): number;
export declare function assertMinorInt(value: unknown): asserts value is number;
export declare function toMinor(inputMajor: string | number, currency: string): number;
export declare function fromMinor(minor: number, currency: string): string;
export declare function formatMinor(minor: number, currency: string, locale?: string): string;
//# sourceMappingURL=money.d.ts.map