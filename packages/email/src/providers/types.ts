import type { CampaignOptions } from "../send";

export interface CampaignProvider {
  send(options: CampaignOptions): Promise<void>;
}

/**
 * Error thrown by providers to indicate whether a failure is retryable.
 */
export class ProviderError extends Error {
  retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.retryable = retryable;
    this.name = "ProviderError";
  }
}
