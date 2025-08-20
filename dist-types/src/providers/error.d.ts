export interface ProviderErrorFields {
    code?: number;
    statusCode?: number;
    retryable?: boolean;
    response?: {
        statusCode?: number;
    };
}
export declare function hasProviderErrorFields(err: unknown): err is ProviderErrorFields;
