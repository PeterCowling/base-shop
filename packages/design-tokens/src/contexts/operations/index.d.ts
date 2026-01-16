/**
 * Operations context tokens
 * Optimized for dense, data-heavy interfaces
 * Used in: Reception, inventory, POS systems, dashboards
 */
export declare const operationsTokens: {
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
};
export type OperationsTokens = typeof operationsTokens;
