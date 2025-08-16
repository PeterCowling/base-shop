/**
 * Error thrown by providers to indicate whether a failure is retryable.
 */
export class ProviderError extends Error {
    retryable;
    constructor(message, retryable = true) {
        super(message);
        this.retryable = retryable;
        this.name = "ProviderError";
    }
}
