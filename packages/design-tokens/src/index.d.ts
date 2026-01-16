export * from './core/spacing';
export * from './core/typography';
export * from './core/colors';
import { operationsTokens } from './contexts/operations';
import { consumerTokens } from './contexts/consumer';
import { hospitalityTokens } from './contexts/hospitality';
export { operationsTokens, consumerTokens, hospitalityTokens };
export type { OperationsTokens } from './contexts/operations';
export type { ConsumerTokens } from './contexts/consumer';
export type { HospitalityTokens } from './contexts/hospitality';
export type TokenContext = 'operations' | 'consumer' | 'hospitality';
export type Density = 'compact' | 'default' | 'comfortable';
/**
 * Get tokens for a specific context
 */
export declare function getContextTokens(context: TokenContext): {
    readonly spacing: {
        readonly 'row-gap': "0.5rem";
        readonly 'section-gap': "1rem";
        readonly 'card-padding': "0.75rem";
        readonly 'input-padding': "0.5rem";
        readonly 'table-cell-padding': "0.5rem";
        readonly 'button-padding-x': "0.75rem";
        readonly 'button-padding-y': "0.5rem";
    };
    readonly typography: {
        readonly 'base-size': "0.875rem";
        readonly 'heading-size': "1.125rem";
        readonly 'label-size': "0.75rem";
        readonly 'data-size': "0.875rem";
    };
    readonly colors: {
        readonly 'status-available': "#16a34a";
        readonly 'status-occupied': "#dc2626";
        readonly 'status-cleaning': "#ca8a04";
        readonly 'status-maintenance': "#2563eb";
        readonly 'stock-low': "#dc2626";
        readonly 'stock-ok': "#16a34a";
        readonly 'stock-high': "#3b82f6";
        readonly 'chart-primary': "#2563eb";
        readonly 'chart-secondary': "#16a34a";
        readonly 'chart-tertiary': "#ca8a04";
        readonly 'chart-quaternary': "#9333ea";
    };
    readonly density: "compact";
} | {
    readonly spacing: {
        readonly 'row-gap': "1.5rem";
        readonly 'section-gap': "3rem";
        readonly 'card-padding': "1.5rem";
        readonly 'input-padding': "1rem";
        readonly 'button-padding-x': "1.5rem";
        readonly 'button-padding-y': "0.75rem";
    };
    readonly typography: {
        readonly 'base-size': "1rem";
        readonly 'heading-size': "1.5rem";
        readonly 'label-size': "0.875rem";
        readonly 'hero-size': "3rem";
    };
    readonly colors: {
        readonly 'brand-primary': "#2563eb";
        readonly 'brand-secondary': "#3b82f6";
        readonly accent: "#16a34a";
        readonly 'price-default': "#111827";
        readonly 'price-sale': "#dc2626";
        readonly 'price-original': "#6b7280";
        readonly 'badge-new': "#16a34a";
        readonly 'badge-sale': "#dc2626";
        readonly 'badge-featured': "#9333ea";
    };
    readonly density: "comfortable";
} | {
    readonly spacing: {
        readonly 'row-gap': "1rem";
        readonly 'section-gap': "2rem";
        readonly 'card-padding': "1rem";
        readonly 'input-padding': "0.75rem";
        readonly 'button-padding-x': "1rem";
        readonly 'button-padding-y': "0.5rem";
    };
    readonly typography: {
        readonly 'base-size': "0.9375rem";
        readonly 'heading-size': "1.25rem";
        readonly 'label-size': "0.8125rem";
    };
    readonly colors: {
        readonly 'room-available': "#16a34a";
        readonly 'room-occupied': "#dc2626";
        readonly 'room-cleaning': "#ca8a04";
        readonly 'room-maintenance': "#4b5563";
        readonly 'amenity-highlight': "#2563eb";
        readonly 'booking-primary': "#16a34a";
        readonly 'booking-secondary': "#3b82f6";
    };
    readonly density: "default";
};
export { contextPlugin } from './tailwind-plugin';
